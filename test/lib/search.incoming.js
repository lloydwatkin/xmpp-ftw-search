'use strict';

/* jshint -W030 */

var Search = require('../../index')
  , ltx    = require('ltx')
  , helper = require('../helper')

describe('Incoming messages', function() {

    var search, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
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

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
        search.init(manager)
    })

    describe('Handles', function() {

        it('Returns false', function() {
            search.handles(ltx.parse('<iq/>')).should.be.false
        })
    })

})