# Flack

Flack is web app messaging application that built for messaging. This application allows users send messages to channels they have created or have been created by others, or send private messages to other users.

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
