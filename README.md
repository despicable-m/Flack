# Flack

The aim of this project is to create a messaging web app using python, javascript and css. Users are required to have a display name before they are allowed to use the app. Once registered, users automatically join a 'default' channel where they're introduced to the app. Users are allowed to create a new channel by clicking on (+) button next to "MY CHANNELS". Users can also send private messages to other users - who are automatically added - listed under 'PRIVATE CHATS'. In all channels and private conversations, users see all older messages in each channel/chat.

## /

        # application.py
    This powers the backend of the app. The file contains all the apps flask routes as well as socketio routes. It controls creating display name, creating new channels, storing of messages in memory, storing of channels in memory, messaging and private messaging, emitting messages and channels to the frontend among others.

        # requirements.txt
    Contains all python packages needed to run the app

## /static

        # script.js
    Contains most of the javascript code that controls the app on the frontend. It controls creating channels and messaging.

        # style.css
    Contains the design of all pages

        # style.scss
    Sass file for style.css

## /templates

        # create.html
    User registration page

        # index.html
    The main page - messaging, channel creation.

        # layout.html
    Main layout of the app. It also contains handlebars templates for messaging and channel creation.
