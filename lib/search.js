var builder  = require('ltx'),
    Base     = require('xmpp-ftw/lib/base'),
    dataForm = require('xmpp-ftw/lib/utils/xep-0004')
    
var Search = function() {}

Search.prototype = new Base()

Search.prototype.NS = 'jabber:iq:search'

Search.prototype.registerEvents = function() {
    var self = this
    this.socket.on('xmpp.search.get', function(data, callback) {
        self.getSearchFields(data, callback)
    })
    this.socket.on('xmpp.search.do', function(data, callback) {
        self.performSearch(data, callback)
    })
}

Search.prototype.handles = function() {
    return false
}

Search.prototype.handle = function() {
    return false
}

Search.prototype.getSearchFields = function(data, callback) {
    var self = this
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
    if (!data.to) return this._clientError('Missing \'to\' key', data, callback)
    
    var stanza = new builder.Element(
        'iq',
        { type: 'get', id: this._getId() , to: data.to }
    ).c('query', this.NS)
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        var x
        if ('error' == stanza.attrs.type)
            return callback(self._parseError(stanza), null)
        var query = stanza.getChild('query')
        var data = { instructions: query.getChildText('instructions') }
        if (!(x = query.getChild('x'))) {
            data.basic = []
            query.children.forEach(function(field) {
                if ('instructions' != field.getName())
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
    
}

module.exports = Search