/**
 * @name edoStereo
 * @version 0.0.2
 * @description [ENG] Adds stereo sound to Discord. [GER] Fügt Stereo Sound zu Discord hinzu.
 * @author ed.o
 * @source https://github.com/edoderg/edoStereo
 * @updateUrl https://github.com/edoderg/edoStereo/blob/main/edoStereo.plugin.js
 */
module.exports = (() => {
  const config = {
    // configuration object for the plugin
    main: "index.js",
    info: {
      name: "edoStereo",
      authors: [{ name: "ed.o", discord_id: "269831113919299584" }],
      version: "0.0.2",
      description:
        "[ENG] Adds stereo sound to Discord. Better Discord v1.9.3 | [GER] Fügt Stereo Sound zu Discord hinzu. ",
    },
    changelog: [
      // changelog info
      {
        title: "Changelog",
        items: ["BetterDiscord Stereo Sound for 1.9.3"],
      },
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
            "BetterDiscord Library Missing",
            `ZeresPluginLibrary is missing. Click "Install Now" to download it.`,
            {
              confirmText: "Install Now",
              cancelText: "Cancel",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error)
                      return require("electron").shell.openExternal(
                        "https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js"
                      );
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
              this.settingsWarning();
              const voiceModule = WebpackModules.getModule(
                BdApi.Webpack.Filters.byPrototypeFields("updateVideoQuality")
              );
              // patch discord's voice module to enable stereo sound
              BdApi.Patcher.after(
                "edoStereo",
                voiceModule.prototype,
                "updateVideoQuality",
                (thisObj, _args, ret) => {
                  if (thisObj) {
                    const setTransportOptions =
                      thisObj.conn.setTransportOptions;
                    thisObj.conn.setTransportOptions = function (obj) {
                      if (obj.audioEncoder) {
                        obj.audioEncoder.params = {
                          stereo: "2",
                        };
                        obj.audioEncoder.channels = 2;
                      }
                      if (obj.fec) {
                        obj.fec = false;
                      }
                      if (obj.encodingVoiceBitRate < 512000) {
                        obj.encodingVoiceBitRate = 512000;
                      }

                      setTransportOptions.call(thisObj, obj);
                    };
                    return ret;
                  }
                }
              );
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
            }

            // creating settings panel
            getSettingsPanel() {
              const panel = this.buildSettingsPanel();
              return panel.getElement();
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();