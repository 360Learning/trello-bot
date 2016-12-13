A collection of scripts using trello API to enforce respect of process @ 360Learning

# Setup

## Getting your Trello API credentials
* [Generate your developer key][devkey]
* To read a user’s private information, get a token by directing them to `https://trello.com/1/connect?key=<PUBLIC_KEY>&name=MyApp&response_type=token` replacing, of course, &lt;PUBLIC_KEY&gt; with the public key obtained in the first step.
* If you never want the token to expire, include `&expiration=never` in the url from the previous step.
* If you need write access as well as read, `&scope=read,write` to the request for your user token.

[devkey]: https://trello.com/1/appKey/generate


## Setting your credentials as environment variables

```
export TRELLO_API_KEY=your_key_here
export TRELLO_TOKEN=your_token_here
```


## Running the scripts
Each script is documented in its header. To launch them, you probably need to edit some IDs. Then this is as simple as :

```
node script.js
```

You can also put them in your crontab :

```
# product bot
*/15 * * * * /home/deploy/.nvm/versions/node/v4.5.0/bin/node /var/www/productbot/bot.js && curl -sm 30 k.wdt.io/<email-address>/<cronjob-name>?c=*/2_*_*_*_*
```

The example cron config above make use of crontab.guru monitoring services. Make sure to replace the <placeholders> with your email address and some name for your cronjob. Should your cron job fail or not even start, you will receive an alert email. (By using this monitoring service, you agree to the Terms of Service and Privacy Policy.)

**Beware** : Remember to `export` your environment variables in `/etc/environment` to have them loaded for cron.




# Style guide
This project relies on[airbnb's javascript repo](https://github.com/airbnb/javascript) style guide.

## Linters

In order to enforce this coding style and improve code quality with automatic tools, this repo is configured to use [eslint](http://eslint.org/docs/user-guide/getting-started). To use it, you first have to install it (global installations provides easier integration) :

```
    npm install -g eslint
```

Eslint will check the js files against a set of rules that we can customize as we want (configure your editor to lint on the fly to have immediate feedback when you code). Those rules are defined in files named `.eslintrc` at the root of every module (all our modules doesn't need the same rules.).

One of the most famous style guide is [airbnb's](https://github.com/airbnb/javascript). Our `.eslintrc` file has been imported from this ruleset (for es5).

## Editors to the rescue
Tweaking the config of your text editor can make the adoption of multiple practices totally painless.
To share some of these configs efficiently across editors, there is a convenient standard named [editorconfig](http://editorconfig.org/) used to specify the conventions for the project (tabs vs spaces, indent size, trim trailing whitespaces... ). That's the reason why there is a `.editorconfig` file at the root of the project, which can (and should) be coupled with [plugins](http://editorconfig.org/#download) on all major editors to import those settings.

You should also configure your text editor to use your linter on the fly, it's awesome (lot of ressources on the web about it. Google it!).
