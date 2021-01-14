import os
import re

from flask import flash, Flask, session, render_template, request, redirect, url_for, jsonify
from flask_session import Session
from functools import wraps
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

"""Variables to store user names, channel names and messages in memory"""
displayName = set()
channels = ["default"]
messages = {"default":
                [ 
                    {
                        "message":"Hello", "sender":"Flack", "time":"not now"
                    },
                    {
                        "message":"You're welcome to the default channel", "sender":"Flack", "time":"not now"
                    },
                    {
                        "message":"You can kick it going right here or you can either create or join another channel.", "sender":"Flack", "time":"not now"
                    }
                ]
            }
users = set()
private = dict()
private_messages = dict()


def login_required(f):
    """
    Decorate routes to require login. Code aken from CS50 finance
    http://flask.pocoo.org/docs/1.0/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/create")
        return f(*args, **kwargs)
    return decorated_function
    

@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    """Loads homepage (chat main screen)"""
    return render_template("index.html")


@app.route("/create", methods=["GET", "POST"])
def create():
    """Let's users add their display name"""
    if request.method == "POST":
        dName = request.form.get("display-name")
        
        # prevents user from submitting an empty display name,
        # a display name that already exists and
        # a display name that includes special characters aside underscore and hyphen
        try:
            if checker(dName) == True:
                flash("Special characters aside - and _ not allowed. Please use another display name name")
                return redirect(url_for('create'))
            elif dName in displayName:
                flash("Display name exists. use another name")
                return redirect(url_for('create'))
            elif len(dName) < 2:
                flash("Display name must be at least 2 characters long.")
                return redirect(url_for('create'))
            # if the display name has no problem, it is added to the set of display names
            else:
                displayName.add(dName)
        except:
            flash("Something went wrong. Please refresh your brower")
            return redirect(url_for('create'))

        # session['user_id'] becomes the display name registered by the user
        session["user_id"] = dName

        # redirects user to app's main page after successful registration
        return redirect(url_for("index"))
    return render_template("create.html")


@app.route("/create_chan", methods=["GET", "POST"])
def create_chan():
    """Let's users create new channels"""
    if request.method == "POST":
        channel = request.form.get("channel")

        # prevents user from submitting an empty display name,
        # a display name with special characters aside underscore and hyphen and
        # a display name that already exists
        try:
            if checker(channel) == True:
                flash("Special characters aside - and _ not allowed. Please use another channel name")
            elif channel in channels:
                flash("Channel exists. use another name")
            elif len(channel) < 2:
                flash("Channel name must be at least 2 characters long.")

            # new channel is added to the list of channels if it has no problem
            else:
                channels.append(channel.lower())

                # a new message dict is created for the new channel
                messages[channel.lower()] = []
        except:
            flash("Something went wrong. Please refresh your brower")
        return redirect(url_for("index"))

    placeholder = 'Create Channel'
    return jsonify({"value":placeholder})


@app.route("/chan_list")
def chan_list():
    """ returns to the client side the list of existing users and channels"""

    u = list(users)
    return jsonify({"users":u, "channels":channels})

    
@app.route("/channel/<channel_name>")
def channel(channel_name):
    """Dynamically generates channel routes"""
    channel_name=channel_name.lower()

    # returns to the client side all existing messages in the channel selected by the user
    return jsonify(messages[channel_name])


@app.route("/private_chat/<chat_name>")
def private_chat(chat_name):
    """Dynamically generate private message routes"""
    
    # sorts sender and receiver names in lexicographical order in a list c_n_list
    c_n = [session['user_id'], chat_name]
    c_n_list = list()
    for x in sort(c_n):
        c_n_list.append(x)

    # combines sender and receiver names from sorted list to creat a unique messaging ID
    cName = c_n_list[0] + '-' + c_n_list[1]

    # unique messaging ID used to create a messaging dict for the sender, receiver
    if cName.lower() not in private_messages:
        private_messages[cName.lower()] = []

    # returns all messages in that unique messaging dict to the 
    # sender, receiver when they need it
    return jsonify(private_messages[cName.lower()])


@app.route("/check_user/<display_name>")
def check_user(display_name):

    """ gets a display name from client side and verifies its integrity"""
    user = display_name

    # sends a json response to client when/if display name exists or
    # display name contains a special character
    if user in displayName:
        return jsonify({'error': "user_name_exists"})
    elif checker(user) == True:
        return jsonify({'error': "special_character"})
    
    # else, it sends a 'go' response to the client side so the user can proceed with
    # registration
    return jsonify({'error': "go"})


@socketio.on('join', namespace='/')
def on_join(data):
    """Let's users join channels"""
    displayName = session["user_id"]

    # converts channel name to lowercase since all channel names are stored in lowercase
    channel = data["room"].lower()
    join_room(channel)

    #send notification that new user has joined the channel
    emit({"msg": displayName + " joined " + channel}, room=channel)


@socketio.on('leave', namespace='/')
def on_leave(data):
    """Let's users leave channels"""
    leave_room(data['room'])

    #send notification alerting other channel members that someone has left
    emit({'msg': session["user_id"] + " has left the channel"}, room=data["room"])


@socketio.on("connected people")
def people(data):
    """Receives users' socket.id to help in private messaging"""
    private[session['user_id']] = data["usocket_id"]
    users.add(session['user_id'])

    a = {"user":session['user_id'], "private":private, "channels":channels}
    emit('announce people', a, broadcast=True)



@socketio.on("submit message")
def message(data):
    """Receives emitted message data from client side and emits same"""
    cl = data["channel"].lower()

    # makes sure that messages are not more than 100 in server memory
    if len(messages[cl]) >= 100:
        flash("Messages more than 100. Older messages have been deleted")
        del messages[cl][0]
        

    # adds new message data to memory and emits to client
    messages[cl].append(data)
    message = data["message"]
    time = data["time"]
    sender = session['user_id']
    emit("announce message", {"message":message, "time":time,
        "sender":sender}, room=cl)


@socketio.on("private message")
def private_m(data):
    """Receives emitted message from private chats"""
    pMessage = data["message"]
    time = data["time"]
    sender = session["user_id"]
    receiver = data["receiver"]

    # sorts sender, receiver display names in lexicographical order to create a unique channel
    chat_n = [sender, receiver]
    chat_n_list = list()
    for x in sort(chat_n):
        chat_n_list.append(x)
    
    chat_name = chat_n_list[0] + '-' + chat_n_list[1]

    # removes an older message if messages for the unique channel is 100
    # and adds the new message sent to the channel
    if len(private_messages[chat_name.lower()]) >= 100:
        flash("Messages more than 100. Older messages have been deleted")
        del private_messages[chat_name.lower()][0]
    private_messages[chat_name.lower()].append(data)

    # emits new message from sender to the receiver
    socketio.emit('private received', {"message":pMessage, "time":time, "sender":sender},
            room=chat_name.lower())


def checker(text):
    """ checks for special characters """
    check_text = re.compile('[}{=~`@#$%^&*():";?/\|>.<,]')

    # returns true is display name has a special character
    # and returns false if it doesn't
    if (check_text.search(text) == None):
        return False
    else:
        return True


def sort(text):

    # taken from https://stackoverflow.com/questions/2669059/how-to-sort-alpha-numeric-set-in-python
    """ Sort the given iterable in the way that humans expect.""" 
    convert = lambda text: int(text) if text.isdigit() else text 
    alphanum_key = lambda key: [ convert(c) for c in re.split('([0-9]+)', key) ] 
    return sorted(text, key = alphanum_key)