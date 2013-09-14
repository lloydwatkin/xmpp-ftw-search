var should = require('should')
  , Search = require('../../lib/search')
  , helper = require('../helper')

describe('Get search form', function() {

    var search, socket, xmpp, manager

    before(function() {
        socket = new helper.Eventer()
        xmpp = new helper.Eventer()
        manager = {
            socket: socket,
            client: xmpp,
            trackId: function(id, callback) {
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            }
        }
        search = new Search()
        search.init(manager)
    })

    it('Errors if no callback provided', function(done) {
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })
        socket.once('xmpp.error.client', function(error) {
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing callback')
            error.request.should.eql({})
            xmpp.removeAllListeners('stanza')
            done()
        })
        socket.emit('xmpp.search.get', {})
    })

    it('Errors if non-function callback provided', function(done) {
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })
        socket.once('xmpp.error.client', function(error) {
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing callback')
            error.request.should.eql({})
            xmpp.removeAllListeners('stanza')
            done()
        })
        socket.emit('xmpp.search.get', {}, true)
    })

    it('Errors if no content key provided', function(done) {
        var request = {}
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })
        var callback = function(error, success) {
            should.not.exist(success)
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing \'to\' key')
            error.request.should.eql(request)
            xmpp.removeAllListeners('stanza')
            done()
        }
        socket.emit(
            'xmpp.search.get',
            request,
            callback
        )
    })
    
    it('Sends expected stanza', function(done) {
        var request = { to: 'characters.shakespeare.lit' }
        xmpp.once('stanza', function(stanza) {
            stanza.is('iq').should.be.true
            stanza.attrs.id.should.exist
            stanza.attrs.to.should.equal(request.to)
            stanza.attrs.type.should.equal('get')
            stanza.getChild('query', Search.NS).should.exist
            done()
        })
        socket.emit('xmpp.search.get', request, function() {})
    })
    
    it('Handles error response', function(done) {
        xmpp.once('stanza', function() {
            manager.makeCallback(helper.getStanza('iq-error'))
        })
        var callback = function(error, success) {
            should.not.exist(success)
            error.should.eql({
                type: 'cancel',
                condition: 'error-condition'
            })
            done()
        }
        var request = { to: 'characters.shakespeare.lit' }
        socket.emit(
            'xmpp.search.get',
            request,
            callback
        )
    })
    
    it('Handles basic search form', function(done) {
        xmpp.once('stanza', function() {
            manager.makeCallback(helper.getStanza('form-basic'))
        })
        var callback = function(error, data) {
            should.not.exist(error)
            data.instructions.should.equal('Search for characters')
            data.basic.length.should.equal(4)
            data.basic.should.eql([
                'first', 'last', 'nick', 'email'  
            ])
            done()
        }
        var request = { to: 'characters.shakespeare.lit' }
        socket.emit(
            'xmpp.search.get',
            request,
            callback
        )
    })
    
})