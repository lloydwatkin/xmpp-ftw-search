var builder = require('ltx'),
    Base    = require('xmpp-ftw/lib/base')
    
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

Search.prototype.handles = function(stanza) {
    return false
}

Search.prototype.handle = function(stanza) {
    return false
}

Search.prototype.getSearchFields = function(data, callback) {
    var self = this
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
}

Search.prototype.performSearch = function(data, callback) {
    var self = this
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
}

module.exports = Search