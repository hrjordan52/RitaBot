// -----------------
// Global variables
// Err TAG: RB002??
// -----------------

/* eslint-disable sort-keys */
/* eslint-disable consistent-return */
// Codebeat:disable[LOC,ABC,BLOCK_NESTING]
const {stripIndent} = require("common-tags");
const {oneLine} = require("common-tags");
const auth = require("./core/auth");
const logger = require("./core/logger");
const messageHandler = require("./message");
const db = require("./core/db");
const react = require("./commands/translation_commands/translate.react");
const botVersion = require("../package.json").version;
const botCreator = "Rita Bot Project";
const joinMessage = require("./commands/info_commands/join");
const {MessageActionRow, MessageSelectMenu} = require("discord.js");

// ----------
// Core Code
// ----------

exports.listen = function listen (client)
{

   let config = null;

   // -----------------
   // Client Connected
   // -----------------

   client.on(
      "ready",
      async () =>
      {

         await db.initializeDatabase(client);

         // -----------------
         // Default Settings
         // -----------------

         config = {
            "botServer": "https://discord.gg/mgNR64R",
            "defaultLanguage": "en",
            "inviteURL": auth.invite || "Set this in your .env file / config variables in Heroku",
            "maxChainLen": 5,
            "maxChains": 10,
            "maxEmbeds": 5,
            "maxMulti": 6,
            "maxTasksPerChannel": 15,
            "translateCmd": "!translate",
            "translateCmdShort": "!tr",
            "version": botVersion
         };

         if (!process.env.DISCORD_BOT_OWNER_ID)
         {

            process.env.DISCORD_BOT_OWNER_ID = "0";

         }

         const singleShard = client.options.shardCount.toString();

         console.log(stripIndent`
         ----------------------------------------
         ${client.user.username} Bot is now online
         V.${config.version} | ID: ${client.user.id}
         Made by: ${botCreator}
         ----------------------------------------`);

         console.log(oneLine`
         Shard: #${singleShard} Shards online -
         ${client.guilds.cache.size.toLocaleString()} guilds.`);

         client.user.setPresence({
            "activity": {
               "name": "ritabot.gg | !tr help",
               "type": "PLAYING"
            },
            "status": "online"
         });

         // ---------------------
         // Log connection event
         // ---------------------

         console.log(stripIndent`
            ----------------------------------------
            All shards online, finalizing DB Setup.`);

         logger(
            "custom",
            {
               "color": "ok",
               "msg": oneLine`
               :wave:  **${client.user.username}**
               - \`v.${botVersion}\` -
               **${singleShard}** shards
            `
            }
         );


      }
   );

   // -----------------
   // Recieved Message
   // -----------------

   client.on(
      "messageCreate",
      (message) =>
      {

         if (message.channel.type !== "DM")
         {

            if (db.server_obj[message.guild.id])
            {

               if (!db.server_obj[message.guild.id].db)
               {

                  return;

               }
               if (config.translateCmdShort !== db.server_obj[message.guild.id].db.prefix)
               {

                  config.translateCmdShort = db.server_obj[message.guild.id].db.prefix;

               }
               // SetStatus(client.user, "online", config);

            }
            if (!message.author.bot)
            {

               if (auth.messageDebug === "3")
               {

                  console.log(`MD3: ${message.guild.name} - ${message.guild.id} - ${message.createdAt} \nMesssage User - ${message.author.tag} \nMesssage Content - ${message.content}\n----------------------------------------`);

               }
               if (auth.messageDebug === "1")
               {

                  console.log(`MD1: ${message.guild.name} - ${message.guild.id} - ${message.createdAt}`);

               }
               const col = "message";
               let id = "bot";
               db.increaseStatsCount(col, id);

               if (message.channel.type === "GUILD_TEXT")
               {

                  id = message.channel.guild.id;

               }

               db.increaseStatsCount(col, id);
               // Need to have another if statment here, if server length is greeater than 1 then run below, if not do nothing.
               // SetStatus(client.user, "online", config);

            }

         }

         messageHandler(
            config,
            message
         );

      }
   );

   // -----------------------------------------------------------
   //  Message edit, Will be fully implemented in future release
   // -----------------------------------------------------------

   // Client.on("messageUpdate", (oldMessage, newMessage) =>
   // {
   //   MessageHandler(config, oldMessage, newMessage);
   // });

   // ---------------
   // Message delete
   // ---------------

   // Client.on("messageDelete", (message) =>
   // {
   //   MessageHandler(config, message, null, true);
   // });

   // -----------
   // Raw events
   // -----------
   client.on(
      "raw",
      (raw) =>
      {

         // ---------------------
         // Listen for reactions
         // ---------------------

         if (raw.t === "MESSAGE_REACTION_ADD")
         {

            react(
               raw.d,
               client
            );

         }

      }
   );

   // ---------------------------
   // Log Client Errors/Warnings
   // ---------------------------

   client.on(
      "error",
      (err) => logger(
         "error",
         err
      )
   );

   client.on(
      "warning",
      (info) => logger(
         "warn",
         info
      )
   );

   client.on(
      "disconnect",
      (event) => logger(
         "error",
         event
      )
   );

   // ------------------------
   // Proccess-related errors
   // ------------------------

   process.on(
      "uncaughtException",
      (err) =>
      {

         logger(
            "dev",
            err
         );
         return logger(
            "error",
            err,
            "uncaught"
         );

      }
   );

   process.on(
      "unhandledRejection",
      (reason) =>
      {

         // console.error("Unhandled promise rejection:", reason);
         const err = `${`Unhandled Rejection` +
           `\nCaused By:\n`}${reason.stack}`;
         logger(
            "dev",
            err
         );
         return logger(
            "error",
            err,
            "unhandled",
         );

      }
   );

   process.on(
      "warning",
      (warning) =>
      {

         logger(
            "dev",
            warning
         );
         return logger(
            "error",
            warning,
            "warning"
         );

      }
   );

   // ---------------------------
   // Delete/leave/change events
   // ---------------------------

   client.on(
      "channelDelete",
      (channel) =>
      {

         db.removeTask(
            channel.id,
            "all",
            // eslint-disable-next-line consistent-return
            function error (err)
            {

               if (err)
               {

                  return logger(
                     "error",
                     err
                  );

               }

            }
         );

      }
   );

   client.on(
      "guildDelete",
      async (guild) =>
      {

         const owner = await guild.fetchOwner();
         logger(
            "guildLeave",
            guild, owner
         );
         db.updateServerTable(guild.id, "active", false, function error (err)
         {

            if (err)
            {

               return console.log("error", err, "command", guild.id);

            }

         });

      }
   );

   client.on(
      "guildUnavailable",
      (guild) => logger(
         "warn",
         `Guild unavailable: ${guild.id}`
      )
   );

   // -----------
   // Guild join
   // -----------

   client.on(
      "guildCreate",
      async (guild) =>
      {

         const owner = await guild.fetchOwner();
         logger(
            "guildJoin",
            guild, owner
         );
         db.servercount(guild);
         db.addServer(
            guild.id,
            config.defaultLanguage,
            db.Servers
         );
         db.getServerInfo(
            guild.id,
            async function getServerInfo (server)
            {

               // console.log(`Server: ${guild.id} has a blacklisted status of: ${server[0].blacklisted}`);
               logger(
                  "activity",
                  {
                     "color": "ok",
                     "msg": oneLine`**Server:** ${guild.id} has a blacklisted status of: **${server[0].blacklisted}**`
                  }
               );

               if (server[0].blacklisted === true)
               {

                  logger(
                     "activity",
                     {
                        "color": "warn",
                        "msg": oneLine`**Server:** ${guild.id} has been kicked as it is blacklisted`
                     }
                  );

                  await guild.leave();

               }

            }

         // eslint-disable-next-line no-unused-vars
         ).catch((err) => console.log("VALIDATION: New Server, No Blacklist History"));
         db.updateServerTable(guild.id, "active", true, function error (err)
         {

            if (err)
            {

               return console.log("error", err, "command", guild.id);

            }

         });
         // console.log(`DEBUG: Blacklist Check Complete`);

         // ---------------------
         // Send Welcome Message
         // ---------------------

         joinMessage(guild, config);

      }
   );

   client.on("interactionCreate", async (interaction) =>
   {

      if (!interaction.isCommand())
      {

         return;

      }

      if (interaction.commandName === "ping")
      {

         const row = new MessageActionRow().
            addComponents(new MessageSelectMenu().
               setCustomId("select").
               setPlaceholder("Nothing selected").
               addOptions([
                  {
                     "label": "Select me",
                     "description": "This is a description",
                     "value": "first_option"
                  },
                  {
                     "label": "You can select me too",
                     "description": "This is also a description",
                     "value": "second_option"
                  }
               ]),);

         await interaction.reply({"content": "Pong!",
            "components": [row]});

      }

   });

};
