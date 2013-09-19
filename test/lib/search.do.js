var should   = require('should')
  , Search   = require('../../lib/search')
  , ltx      = require('ltx')
  , helper   = require('../helper')
  , dataForm = require('xmpp-ftw/lib/utils/xep-0004')

describe('Perform search', function() {

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
        socket.emit('xmpp.search.do', {})
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
        socket.emit('xmpp.search.do', {}, true)
    })

    it('Errors if no \'to\' key provided', function(done) {
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
            'xmpp.search.do',
            request,
            callback
        )
    })
    
    it('Errors if no \'basic\' or \'form\' key provided', function(done) {
        var request = { to: 'characters.shakespeare.lit' }
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })
        var callback = function(error, success) {
            should.not.exist(success)
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing \'basic\' or \'form\' key')
            error.request.should.eql(request)
            xmpp.removeAllListeners('stanza')
            done()
        }
        socket.emit(
            'xmpp.search.do',
            request,
            callback
        )
    })
    
    describe('Basic form search', function() {
        
        it('Sends expected stanza', function(done) {
            var request = {
                to: 'characters.shakespeare.lit',
                basic: {
                    first: 'romeo',
                    last: 'montague'
                }
            }
            xmpp.once('stanza', function(stanza) {
                stanza.is('iq').should.be.true
                stanza.attrs.id.should.exist
                stanza.attrs.to.should.equal(request.to)
                stanza.attrs.type.should.equal('set')
                var query = stanza.getChild('query', search.NS)
                query.should.exist
                for (var i in request.basic)
                    query.getChildText(i).should.equal(request.basic[i])
                done()
            })
            socket.emit(
                'xmpp.search.do',
                request,
                function() {}
            )
        })
        
    })
    
    describe('Extensible form search', function() {
        
        it('Errors unparsable data form details', function(done) {
            var request = {
                to: 'characters.shakespeare.lit',
                form: true
            }
            var callback = function(error, data) {
                should.not.exist(data)
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Badly formatted data form')
                error.request.should.eql(request)
                done()
            }
            socket.emit(
                'xmpp.search.do',
                request,
                callback
            )
        })
        
        it('Sends expected stanza', function(done) {
            var request = {
                to: 'characters.shakespeare.lit',
                form: [
                    { var: 'first', value: 'romeo' },
                    { var: 'last', value: 'montague' }
                ]
            }
            xmpp.once('stanza', function(stanza) {
                stanza.is('iq').should.be.true
                stanza.attrs.id.should.exist
                stanza.attrs.to.should.equal(request.to)
                stanza.attrs.type.should.equal('set')
                var form = stanza.getChild('query', search.NS)
                    .getChild('x', dataForm.NS)
                form.should.exist
                form.children.length.should.equal(3)
                
                form.children[0].getName().should.equal('field')
                form.children[0].attrs.var.should.equal('FORM_TYPE')
                form.children[0].getChildText('value').should.equal(search.NS)
                
                form.children[1].getName().should.equal('field')
                form.children[1].attrs.var
                    .should.equal(request.form[0].var)
                form.children[1].getChildText('value')
                    .should.equal(request.form[0].value)
                
                form.children[2].getName().should.equal('field')
                form.children[2].attrs.var
                    .should.equal(request.form[1].var)
                form.children[2].getChildText('value')
                    .should.equal(request.form[1].value)
                
                done()
            })
            socket.emit(
                'xmpp.search.do',
                request,
                function() {}
            )
        })
        
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
        var request = { 
            to: 'characters.shakespeare.lit',
            basic: { first: 'romeo' }            
        }
        socket.emit(
            'xmpp.search.do',
            request,
            callback
        )
    })
    
    it('Handles no results', function(done) {
        xmpp.once('stanza', function() {
            manager.makeCallback(helper.getStanza('no-results'))
        })
        var callback = function(error, data) {
            should.not.exist(error)
            data.should.eql({
               fields: {},
               results: []
            })
            done()
        }
        var request = { 
            to: 'characters.shakespeare.lit',
            basic: { first: 'romeo' }            
        }
        socket.emit(
            'xmpp.search.do',
            request,
            callback
        )
    })
    
    it('Returns results in expected format', function(done) {
        xmpp.once('stanza', function() {
            manager.makeCallback(helper.getStanza('search-results'))
        })
        var callback = function(error, data) {
            should.not.exist(error)
            Object.keys(data.fields).length.should.equal(4)
            data.fields.first.should.eql({
                label: 'Given Name', type: 'text-single'
            })
            data.fields.last.should.eql({
                label: 'Family Name', type: 'text-single'
            })
            data.fields.jid.should.eql({
                label: 'Jabber ID', type: 'jid-single'
            })    
            data.fields.tags.should.eql({
                label: 'Tags', type: 'text-multi'
            })
            
            data.results.length.should.equal(2)
            data.results[0]['first'].should.equal('Benvolio')
            data.results[0]['last'].should.equal('Montague')
            data.results[0]['jid'].should.equal('benvolio@montague.net')
            data.results[0]['tags'].should.eql(['friend'])
            
            data.results.length.should.equal(2)
            data.results[1]['first'].should.equal('Romeo')
            data.results[1]['last'].should.equal('Montague')
            data.results[1]['jid'].should.equal('romeo@montague.net')
            data.results[1]['tags'].should.eql(['friend', 'lover'])            
            
            done()
        }
        var request = { 
            to: 'characters.shakespeare.lit',
            basic: { first: 'romeo' }            
        }
        socket.emit(
            'xmpp.search.do',
            request,
            callback
        )
    })
    
})