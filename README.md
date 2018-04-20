# Time Todo

Basic todo app with Alexa endpoints to transform it into a basic tv guide / watchlist

# Deploy

### Heroku Button - one click deploy

Click this Heroku button to deploy straight to Heroku.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Note: It's the `app.json` file that defines the deploy button's config.

-OR-

1.  Clone the repository

        git clone https://github.com/travega/time-todo.git

2. Create a Heroku App

        heroku create

3. Add MongoDB

        heroku addons:create mongolab

4. Deploy to heroku

        git push heroku master

### Pre-populate tv listings

Run the following curl command to populate the tv listings

        curl -X POST https://<your_app_name>.herokuapp.com/api/tvshow -d '{ "tvShows": "The Wire" }'

You can run it a few times to add more shows.

Note: there's no uniqueness checking in place on the `tvShows` value so you will be able to add the same name multiple times.

### Structure

- **./server.js** - ExpresJS server that serves the ionic2 app
- **./app** - Ionic2 app root directory
- **./app/pages** - App views. There's just 2 views: Todo list & edit todo item screens
- **./app/providers/todo-service.ts** - API model adapter service

# Alexa TV Time

The Todo app can be turned into a basic TV Guide controlled via Alexa.

Here's a Gist with the Alexa skill config:

https://gist.github.com/travega/15be1821cf44f4282cb7bece6b1795f9.js
