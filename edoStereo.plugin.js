/**
 * @name edoStereo
 * @version 0.0.5
 * @description Adds stereo sound to Discord. Better Discord v1.9.5
 * @authorLink https://github.com/edoderg
 * @website https://edoderg.github.io/
 * @source https://github.com/edoderg/edoStereo
 * @invite fgMC6SetXk
 * @updateUrl https://github.com/edoderg/edoStereo/blob/main/edoStereo.plugin.js
 */
module.exports = (() => {
  const config = {
    // configuration object for the plugin
    main: "index.js",
    info: {
      name: "edoStereo",
      authors: [{ name: "ed.o", discord_id: "269831113919299584" }],
      version: "0.0.5",
      description:
        "Adds stereo sound to your Discord Client. Better Discord v1.9.5",
    },
    changelog: [
      {
        title: "Changelog",
        items: ["BetterDiscord Stereo Sound for 1.9.5", "Added an option to change your bitrate", "Added an notification when joining voice channel", "Removed unnecessary stuff"]
      }
    ],
    defaultConfig: [
      // default configuration options for the plugin
      {
        type: "switch",
        id: "enableToasts",
        name: "Enable notifications",
        note: "Warning for Discord Audio Features",
        value: true,
      },
      {
        type: "dropdown",
        id: "stereoChannelOption",
        name: "Stereo Channel Option",
        note: "Select your preferred channel option",
        value: "7.1",
        options: [
          { label: "1.0 Mono Sound", value: "1.0" },
          { label: "2.0 Normal Stereo Sound", value: "2.0" },
          { label: "7.1 Surround Sound (Default)", value: "7.1" },
        ],
      },
      {
        type: "dropdown",
        id: "bitrateOption",
        name: "Bitrate Option",
        note: "Select your preferred bitrate",
        value: "512000",
        options: [
            { label: "8kbps", value: "8000" }, // 🗑️
            { label: "48kbps", value: "48000" },
            { label: "128kbps", value: "128000" },
            { label: "512kbps (Default)", value: "512000" },
        ],
      },
      {
        type: "category",
        id: "otherSettings",
        name: "Miscellaneous",
        shown: true,
        settings: [
          {
            type: "switch",
            id: "comingSoon1",
            name: "New Features", // 💔
            note: "New Features",
            value: false,
            disabled: true,
          },
        ],
      },
    ],
  };
  return !global.ZeresPluginLibrary
    ? class {
        // placeholder for when zerespluginlibrary is missing
        constructor() {
          this._config = config;
        }
        getName() {
          return config.info.name;
        }
        getAuthor() {
          return config.info.authors.map((a) => a.name).join(", ");
        }
        getDescription() {
          return config.info.description;
        }
        getVersion() {
          return config.info.version;
        }
        load() {
          // show modal to install zerespluginlibrary
          BdApi.showConfirmationModal(
            "[edoStereo] Library Missing",
            `ZeresPluginLibrary is missing. Click "Install Now" to download it.`,
            {
              confirmText: "Install Now",
              cancelText: "Cancel",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error) {
                      console.error("Error downloading ZeresPluginLibrary:", error);
                      BdApi.showConfirmationModal(
                        "Download Error",
                        "An error occurred while downloading ZeresPluginLibrary. Please try again later or download it manually from the official website.",
                        {
                          confirmText: "OK",
                          cancelText: "Cancel",
                        }
                      );
                      return;
                    }
                    await new Promise((r) =>
                      require("fs").writeFile(
                        require("path").join(
                          BdApi.Plugins.folder,
                          "0PluginLibrary.plugin.js"
                        ),
                        body,
                        r
                      )
                    );
                  }
                );
              },
            }
          );
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        // actual plugin implementation when zerespluginlibrary is available
        const plugin = (Plugin, Library) => {
          const { WebpackModules, Patcher, Toasts } = Library;
          return class edoStereo extends Plugin {
            // plugin start method
            onStart() {
              BdApi.UI.showNotice("[edoStereo v.0.0.5] You can now use edoStereo! 😉", { type: "info", timeout: 5000 });
              this.settingsWarning();
              this.justJoined = false;
              const voiceModule = WebpackModules.getModule( BdApi.Webpack.Filters.byPrototypeFields("updateVideoQuality") );
              // patch discord's voice module to enable stereo sound
              BdApi.Patcher.after("edoStereo", voiceModule.prototype, "updateVideoQuality", (thisObj, _args, ret) => {
                  if (thisObj) {
                    const setTransportOptions = thisObj.conn.setTransportOptions;
                    const channelOption = this.settings.stereoChannelOption;
                    const selectedBitrate = this.settings.bitrateOption; 

                    thisObj.conn.setTransportOptions = function (obj) {
                      if (obj.audioEncoder) {
                        obj.audioEncoder.params = {
                          stereo: channelOption,
                        };
                        obj.audioEncoder.channels = parseFloat(channelOption);
                        obj.encodingVoiceBitRate = parseInt(selectedBitrate);
                      }
                      if (obj.fec) {
                        obj.fec = false; // disable forward error correction (fec)
                      }
                      obj.encodingVoiceBitRate = parseInt(selectedBitrate); // added
                      setTransportOptions.call(thisObj.conn, obj);
                      if (!this.justJoined) {
                        Toasts.show("You're using edoStereo now!", { type: "info", timeout: 5000 });
                        this.justJoined = true;
                      }
                    };
                    return ret;
                  }
                }
              );
              const voiceConnectionModule = WebpackModules.getByProps("hasVideo", "disconnect", "isConnected");
              this.disconnectPatcher = BdApi.Patcher.after("edoStereo", voiceConnectionModule, "disconnect", () => {
                this.justJoined = false;
              });
            }
            // display settings warning
            settingsWarning() {
              const voiceSettingsStore = WebpackModules.getByProps(
                "getEchoCancellation"
              );
              if (
                voiceSettingsStore.getNoiseSuppression() ||
                voiceSettingsStore.getNoiseCancellation() ||
                voiceSettingsStore.getEchoCancellation()
              ) {
                if (this.settings.enableToasts) {
                  // show a toast notification for user
                  Toasts.show(
                    "Please disable echo cancellation, noise reduction, and noise suppression for edoStereo",
                    { type: "warning", timeout: 5000 }
                  );
                }
                return true;
              } else return false;
            }
            // plugin stop method
            onStop() {
              Patcher.unpatchAll();
              if (this.disconnectPatcher) this.disconnectPatcher();
            }
            // creating settings panel
            getSettingsPanel() {
              const panel = this.buildSettingsPanel();
              const noteElement = document.createElement("div");
              noteElement.className = "edoStereo-settings-note";
              noteElement.textContent = "Note: After changing any setting, please rejoin the voice channel for the changes to take effect.";
              noteElement.style.color = "#FF0000";
              noteElement.style.marginTop = "10px";
              panel.append(noteElement);
              return panel.getElement();
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();
