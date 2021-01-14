// global variable keeping track of current channel user is in
let nName = '';

// keeps track of previously entered room
let previousRoom = '';

// remembers last channel user was in before restarting browser or refreshing page
let remCha = localStorage.getItem('stored_page');

// keeps track of all available users
jUsers = [];

// stores property value pairs of users and their socket id
let userSocket = {};

// stores channels
availableChannels = [];

const template = Handlebars.compile(document.querySelector('#hand-mess').innerHTML);
const chan_template = Handlebars.compile(document.querySelector('#hand-chan').innerHTML);
const private_template = Handlebars.compile(document.querySelector('#hand-private').innerHTML);
const channelList_template = Handlebars.compile(document.querySelector('#hand-my-channels').innerHTML);

// Connect to websocket
var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);


document.addEventListener('DOMContentLoaded', () => {

    /* loads page for each session
        (whether user is logging in for the first time of the refreshing the page) */
    if (localStorage.getItem('stored_page') === null) {
        load_page("Default");
        loadChanList();
        joinRoom('defaut');
        previousRoom = 'default';
    } else {

        var cTLoad = remCha.split('-')
        // loads user's last channel (public or private)
        if (cTLoad[1] === 'private') {
            loadPrivate(cTLoad[0]);
            loadChanList();
            previousRoom = cTLoad[0];

        } else if (cTLoad[1] === 'public') {
            load_page(cTLoad[0]);
            loadChanList();
            joinRoom(cTLoad[0]);
            previousRoom = cTLoad[0];
        }
    }


    // populates chat space with 'create channel' elements
    document.querySelector('#create-button').addEventListener('click', () => {

        backgroudChange('chan-mess-head-id');

        document.querySelector('.messages').remove();
        load_channel();
        document.querySelector('#cName').innerHTML = 'Create New Channel';
    });
});


// function for loading page; takes name of channel clicked on as argument
function load_page(name) {
    const request = new XMLHttpRequest();
    request.open('GET', `/channel/${name}`);

    nName = name;
    joinRoom(nName);
    request.onload = () => {
        document.querySelector('#send-message').value = '';
        const response = request.responseText;
        var resp = JSON.parse(response);

        // populates chat space with messages stored in memory
        for (i = 0; i < resp.length; i++) {
            const content = template({
                'value': resp[i].message,
                'time': resp[i].time,
                'user_id': resp[i].sender
            });
            document.querySelector('.mess-box').innerHTML += content;

            if (resp[i].sender === localStorage.getItem('displayName')) {
                document.querySelectorAll('#m' + resp[i].sender).forEach(text => {
                    text.setAttribute("style", "justify-self: right");
                });
            }

            // from https://stackoverflow.com/questions/40903462/how-to-keep-a-scrollbar-always-bottom
            var messageBox = document.querySelector('.mess-box');
            messageBox.scrollTop = messageBox.scrollHeight - messageBox.clientHeight;

        }
        document.querySelector('#' + nName.replace(/ /g, '-')).style.backgroundColor = '#3A1616';
        document.querySelector('#cName').innerHTML = '# ' + nName.toLowerCase();
    };
    request.send();
};

// function for loading channel creation page
function load_channel() {
    const request = new XMLHttpRequest();
    request.open('GET', `/create_chan`);

    request.onload = () => {
        const response = request.responseText;
        var resp = JSON.parse(response)
        
        // populates chat space with channel creation elements
        const content = chan_template({
            'value': resp.value
        });
        remover();
        document.querySelector('.mess-box').innerHTML += content;

    };
    request.send();
};


// function for loading private chats
function loadPrivate(name) {
    const request = new XMLHttpRequest();
    request.open('GET', `/private_chat/${name}`);

    nName = name;
    roomArray = [localStorage.getItem('displayName'), name]
    var roomToJoin = roomArray.sort();
    var RTJ = roomToJoin[0] + '-' + roomToJoin[1]
    joinRoom(RTJ);
    previousRoom = RTJ.toLowerCase();
    request.onload = () => {

        //populate chat space with messages from that end
        const response = request.responseText;
        var resp = JSON.parse(response);

        // populates chat space with messages stored in memory
        for (i = 0; i < resp.length; i++) {
            const content = template({
                'value': resp[i].message,
                'time': resp[i].time,
                'user_id': resp[i].sender
            });
            document.querySelector('.mess-box').innerHTML += content;

            if (resp[i].sender === localStorage.getItem('displayName')) {
                document.querySelectorAll('#m' + resp[i].sender).forEach(text => {
                    text.setAttribute("style", "justify-self: right");
                });
            }
            // from https://stackoverflow.com/questions/40903462/how-to-keep-a-scrollbar-always-bottom
            var messageBox = document.querySelector('.mess-box');
            messageBox.scrollTop = messageBox.scrollHeight - messageBox.clientHeight;
        }
        document.querySelector('#' + nName.replace(/ /g, '-')).style.backgroundColor = '#3A1616';
        document.querySelector('#cName').innerHTML = nName;
    }
    request.send();
}


// loads list of channels
function loadChanList() {
    const request = new XMLHttpRequest();
    request.open('GET', `/chan_list`);

    request.onload = () => {
        const response = request.responseText;
        var resp = JSON.parse(response)
        var channels = resp['channels']
        var users = resp['users']

        // populates channels list with existing channels in server memory
        for (i = 0; i < channels.length; i++) {
            const content = channelList_template({
                'value': channels[i]
            });

            if (!availableChannels.includes(channels[i])) {
                document.querySelector('.channel-list').innerHTML += content;

                // adds channels in server memory to client side memory
                availableChannels.push(channels[i]);
            }

        };

        // populates private chats column with display names of connected users
        for (i = 0; i < users.length; i++) {
            const content = private_template({
                'value': users[i]
            });

            if (users[i] !== localStorage.getItem('displayName')) {
                document.querySelector('.private-channels').innerHTML += content;
            }
            jUsers.push(users[i]);
        }



        // link browsing for public channels
        document.querySelectorAll('.nav-link').forEach(link => {
            link.onclick = () => {
                leaveRoom(previousRoom);
                remover();
                load_page(link.dataset.page);
                previousRoom = nName;
                localStorage.setItem("stored_page", nName + '-public');

                backgroudChange(nName);

                document.querySelector('#cName').innerHTML = '# ' + nName.toLowerCase();
                return false;
            };
        });

        // link browsing for private chats
        document.querySelectorAll('.nav-link2').forEach(link => {
            link.onclick = () => {
                remover();
                leaveRoom(previousRoom);
                loadPrivate(link.dataset.page);

                localStorage.setItem('stored_page', nName + '-private');
                
                backgroudChange(nName);
                
                document.querySelector('#cName').innerHTML = nName;
            }
        });
    }
    request.send();
}

// clears chat space
function remover() {
    var ab = document.querySelector('.mess-box');
    while (ab.firstChild) {
        ab.removeChild(ab.lastChild);
    }
};


// joining a channel
function joinRoom(room) {
    socket.emit('join', {
        'room': room
    });
};

// leaving a channel
function leaveRoom(room) {
    socket.emit('leave', {
        'room': room
    });
};


socket.on('connect', () => {

    socket.emit('connected people', {
        "usocket_id": socket.id
    });

    document.querySelector('#messag').addEventListener('submit', (event) => {

        var mSage = document.querySelector('#send-message').value;

        // prevents user from sending empty messages
        if (mSage.length < 1) {
            event.preventDefault();
            return false;
        }

        //date and time and message variables
        var dt = new Date();
        var time = dt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        // prevents page from loading
        event.preventDefault();

        // gets the nav-link currently clicked on
        var clicked = document.querySelector('#' + nName.replace(/ /g, '-'))

        // emits message to public socket if the current link is for a public channel
        if (clicked.classList.contains('nav-link')) {
            socket.emit('submit message', {
                'message': mSage,
                "time": time,
                "sender": localStorage.getItem('displayName'),
                "channel": nName
            });
        }
        // emits message to private socket if the current link is for a private channel
        else {
            socket.emit('private message', {
                'message': mSage,
                'time': time,
                'sender': localStorage.getItem('displayName'),
                'receiver': nName
            });
        };

    });
});

// When message is broadcasted, add to messages and clear message box
socket.on('announce message', data => {

    // populates chat space with real time messages
    const content = template({
        'value': data.message,
        'time': data.time,
        'user_id': data.sender
    });
    document.querySelector('.mess-box').innerHTML += content;
    if (data.sender === localStorage.getItem('displayName')) {
        document.querySelectorAll('#m' + data.sender).forEach(text => {
            text.setAttribute("style", "justify-self: right");
        });
    }
    // from https://stackoverflow.com/questions/40903462/how-to-keep-a-scrollbar-always-bottom
    var messageBox = document.querySelector('.mess-box');
    messageBox.scrollTop = messageBox.scrollHeight - messageBox.clientHeight;
    document.querySelector('#send-message').value = '';
});


// When a new user is connected, the user's id is sent to everyone
socket.on('announce people', data => {

    // userSocket = data.private;

    // auto-populates channels list with new channels
    for (i = 0; i < data.channels.length; i++) {
        if (!availableChannels.includes(data.channels[i])) {
            const content = channelList_template({
                'value': data.channels[i]
            })
            document.querySelector('.channel-list').innerHTML += content;
            availableChannels.push(data.channels[i]);

            document.querySelectorAll('.nav-link').forEach(link => {
                link.onclick = () => {
                    leaveRoom(previousRoom);
                    remover();
                    load_page(link.dataset.page);
                    previousRoom = nName;
                    localStorage.setItem("stored_page", nName + '-public');

                    backgroudChange(nName);

                    document.querySelector('#cName').innerHTML = '# ' + nName.toLowerCase();
                    return false;
                };
            });
        }
    }

    // populate channel column with new private users
    const content = private_template({
        'value': data.user
    });

    if (!jUsers.includes(data.user) && data.user !== localStorage.getItem('displayName')) {
        document.querySelector('.private-channels').innerHTML += content;
        jUsers.push(data.user)

        // link browsing for private chats
        document.querySelectorAll('.nav-link2').forEach(link => {
            link.onclick = () => {
                remover();
                leaveRoom(previousRoom);
                loadPrivate(link.dataset.page);

                localStorage.setItem('stored_page', nName + '-private');

                backgroudChange(nName);

                document.querySelector('#cName').innerHTML = nName;
            }
        });
    }
});


// When a private message is announced, it is sent to the user
socket.on('private received', data => {
    const content = template({
        'value': data.message,
        'time': data.time,
        'user_id': data.sender
    });
    document.querySelector('.mess-box').innerHTML += content;

    if (data.sender === localStorage.getItem('displayName')) {
        document.querySelectorAll('#m' + data.sender).forEach(text => {
            text.setAttribute("style", "justify-self: right");
        });
    }
    // from https://stackoverflow.com/questions/40903462/how-to-keep-a-scrollbar-always-bottom
    var messageBox = document.querySelector('.mess-box');
    messageBox.scrollTop = messageBox.scrollHeight - messageBox.clientHeight;

    document.querySelector('#send-message').value = '';
});

// handlebars helper to help hyphenate ids
Handlebars.registerHelper('hyphenate', function (text) {
    var nText = text.data.root.value;
    return nText.split(' ').join('-');
});

// removes background colour of previously clicked channels/display name
// and changes the background colour of the recently clicked channel/display name
function backgroudChange(link) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.style.backgroundColor = '';
    });
    document.querySelectorAll('.nav-link2').forEach(link => {
        link.style.backgroundColor = '';
    });

    document.querySelector('#' + link.replace(/ /g, '-')).style.backgroundColor = '#3A1616'
}