# Flack overview

Flack is web application that is built for messaging. This application allows users to send messages to channels they have created or have been created by others, and/or send private messages to other users. All messages and created channels are stored in memory so all messages will be lost once the server is restarted.

## Registration

Users can register using any username — provided that username has not been chosen by another user. Users do not need passwords to register. User's registered username is stored in local storage so the user is identified through all browsing sessions. This makes it possible for the user to continue chatting without re-registering when the user closes and re-opens the browser or closes and re-opensthe chat tab.

## Homepage

Once a user successfully registers using a unique username, the user is redirected to the homepage of the web application; where the user can create a new channel, join existing channels or send private messages to other users.

![Homepage after registering](readme_assets/flack_homepage.png)

## Creating channels

Any user can create a channel by clicking the plus ⨁ icon next to **MY CHANNEL**. Once a user creates a channel, this channel is displayed to other users who can join, send and receive messages from the created channel.

## Joining channels

In order to send a message, the user must first join a channel. To do this, the user just needs to click on the name of the channel s/he wishes to join.

## Sending messages - channels

To send messages to channels, the user needs to click on the channel name, type the message in the text field and hit send.

## Sending messages - private
The user needs to click on the username of the user s/he wishes to send the message to under **PRIVATE CHATS**, type the message and hit send.

![Messaging](readme_assets/flack_messaging.png)

# Files

## Back end

### [application.py](application.py "application.py")

This powers the backend of the app. The file contains all the app's flask routes as well as socketio routes. It controls creating display name, creating new channels, storing of messages in memory, storing of channels in memory, messaging in channels and private messaging, emitting messages and channels to the front end, among others.

### [requirements.txt](requirements.txt "requirements.txt")

A list of all python packages needed to run the app.

## Front end

## _static_

### script.js

Contains the javascript code that controls the app on the front end. It controls how channels are created, joined and how messages are sent and delivered.

### style.css

Contains the design of all pages.

### style.scss

Sass file for style.css

## _templates_

### create.html

HTML for user registration page of the application.

### index.html

HTML for the main page of the web application - messaging, channel creation.

### layout.html

Main layout of the app. It also contains handlebars templates for messaging and channel creation.
