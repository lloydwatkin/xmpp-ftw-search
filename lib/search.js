'use strict';

var builder  = require('ltx')
  , Base     = require('xmpp-ftw').Base
  , dataForm = require('xmpp-ftw').utils['xep-0004']

var Search = function() {}

Search.prototype = new Base()

Search.prototype.NS = 'jabber:iq:search'

Search.prototype._events = {
    'xmpp.search.get': 'getSearchFields',
    'xmpp.search.do': 'performSearch'
}

Search.prototype.getSearchFields = function(data, callback) {
    var self = this
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
    if (!data.to) return this._clientError('Missing \'to\' key', data, callback)

    var stanza = new builder.Element(
        'iq',
        { type: 'get', id: this._getId() , to: data.to }
    ).c('query', { xmlns: this.NS })
    this.manager.trackId(stanza, function(stanza) {
        var x
        if ('error' === stanza.attrs.type)
            return callback(self._parseError(stanza), null)
        var query = stanza.getChild('query')
        var data = { instructions: query.getChildText('instructions') }
        if (!(x = query.getChild('x'))) {
            data.basic = []
            query.children.forEach(function(field) {
                if ('instructions' !== field.getName())
                    data.basic.push(field.getName())
            })
        } else {
            data.form = dataForm.parseFields(x)
        }
        callback(null, data)
    })
    this.client.send(stanza)
}

Search.prototype.performSearch = function(data, callback) {
    var self = this
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
    if (!data.to)
        return this._clientError('Missing \'to\' key', data, callback)
    if (!data.basic && !data.form)
        return this._clientError('Missing \'basic\' or \'form\' key', data, callback)
    var stanza = new builder.Element(
        'iq',
        { type: 'set', id: this._getId() , to: data.to }
    ).c('query', { xmlns: this.NS })
    if (data.basic) {
        for (var i in data.basic)
            stanza.c(i).t(data.basic[i]).up()
    } else {
        try {
            dataForm.addForm(stanza, data.form, this.NS)
        } catch (e) {
            return this._clientError('Badly formatted data form', data, callback)
        }
    }
    this.manager.trackId(stanza, function(stanza) {
        if ('error' === stanza.attrs.type)
            return callback(self._parseError(stanza))
        var fields = {}, results = [], x, reported
        if ((x = stanza.getChild('query').getChild('x')) &&
            (reported = x.getChild('reported'))) {
            fields = self._getFields(reported.getChildren('field'))
            results = self._getResults(x.getChildren('item'), fields)
        }
        callback(null, { fields: fields, results: results })
    })
    this.client.send(stanza)
}

Search.prototype._getFieldValue = function(field, type) {
    return dataForm.getValues(field, type)
}

Search.prototype._getResults = function(items, reported) {
    var results = []
    var self = this
    items.forEach(function(item) {
        var result = {}
        item.getChildren('field').forEach(function(field) {
            result[field.attrs.var] = self._getFieldValue(
                field, reported[field.attrs.var].type
            )
        })
        results.push(result)
    })
    return results
}

Search.prototype._getFields = function(reported) {
    var fields = {}
    reported.forEach(function(field) {
        fields[field.attrs.var] = {
            label: field.attrs.label,
            type: field.attrs.type
        }
    })
    return fields
}

module.exports = Search