var fly = require('fly');
// var io = require('socket.io');
module.exports = fly.Component.extend({
    name: 'control',
    template: fly.template(__inline('./control.html')),
    ctor: function (element, options) {
        this._super(element, options);
        var socket = this.socket = io.connect('http://localhost:1414');
        console.log(socket);
        socket.emit('regController', {},function(msg){
            console.log(msg);
        });
    },
    options: {},
    btnClick: function(){
        console.log(123);
        this.socket.emit('send', {msg:'改一下'},function(msg){
            console.log(msg);
        });
    }
});