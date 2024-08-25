/**
 * @name edoStereo
 * @version 0.0.6
 * @description Adds stereo sound to Discord with some extra stuff. Better Discord v1.10.2
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
      authors: [
        { name: "ed.o", discord_id: "269831113919299584" }
      ],
      version: "0.0.6",
      description:
        "Adds stereo sound to your Discord Client with some extra stuff. Better Discord v1.10.2",
    },
    changelog: [
      {
        title: "Changelog",
        items: [
          "Integrated Spotify Pause Blocker functionality",
          "Added more bitrate options",
          "Now shows current settings when joining a voice channel / In the settings panel",
          "General improvements and optimizations"
        ]
      }
    ],
    defaultConfig: [
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
        value: "2.0",
        options: [
          { label: "1.0 Mono Sound", value: "1.0" },
          { label: "2.0 Normal Stereo Sound (Default)", value: "2.0" },
          { label: "7.1 Surround Sound", value: "7.1" },
        ],
      },
      {
        type: "dropdown",
        id: "bitrateOption", // removed 8kbps option
        name: "Bitrate Option",
        note: "Select your preferred bitrate",
        value: "384000",
        options: [
          { label: "48kbps", value: "48000" }, 
          { label: "64kbps", value: "64000" },
          { label: "96kbps", value: "96000" },
          { label: "128kbps", value: "128000" },
          { label: "256kbps", value: "256000" },
          { label: "384kbps (Default)", value: "384000" },
          { label: "512kbps", value: "512000" },
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
            id: "enableSpotifyPauseBlocker", // added
            name: "Spotify Pause Blocker",
            note: "Prevents Discord from pausing Spotify after 30 seconds of constant mic input",
            value: false,
          },
        ],
      },
    ],
  };

  return !global.ZeresPluginLibrary
    ? class {
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
        const plugin = (Plugin, Library) => {
          const { WebpackModules, Patcher, Toasts } = Library;
          return class edoStereo extends Plugin {
            onStart() {
              BdApi.UI.showNotice("[edoStereo v.0.0.6] You can now use edoStereo 😉", { type: "info", timeout: 5000 });
              this.settingsWarning();
              this.justJoined = false;
              // patch discord's voice module to enable stereo sound
              const voiceModule = WebpackModules.getModule(BdApi.Webpack.Filters.byPrototypeFields("updateVideoQuality"));
              
              BdApi.Patcher.after("edoStereo", voiceModule.prototype, "updateVideoQuality", (thisObj, _args, ret) => {
                if (thisObj) {
                  const setTransportOptions = thisObj.conn.setTransportOptions;
                  const channelOption = this.settings.stereoChannelOption;
                  const selectedBitrate = this.settings.bitrateOption; 

                  thisObj.conn.setTransportOptions = (obj) => {
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
                    if (obj.encodingVoiceBitRate < selectedBitrate) {
                      obj.encodingVoiceBitRate = selectedBitrate;
                    }
                    setTransportOptions.call(thisObj.conn, obj);
                    if (!this.justJoined) {
                      const spotifyStatus = this.settings.otherSettings.enableSpotifyPauseBlocker ? "Enabled" : "Disabled";
                      this.showCustomToast(`edoStereo: Channel ${channelOption}, Bitrate ${parseInt(selectedBitrate)/1000}kbps, Spotify Blocker: ${spotifyStatus}`, { type: "info", timeout: 5000 });
                      this.justJoined = true;
                    }
                  };
                  return ret;
                }
              });

              this.showCustomToast = (content, options) => { // added
                  const toastElement = BdApi.UI.showToast(content, options);
                  if (toastElement) {
                    toastElement.style.position = 'fixed';
                    toastElement.style.top = '20px';
                    toastElement.style.right = '20px';
                    toastElement.style.left = 'auto';
                    toastElement.style.bottom = 'auto';
                  }
                };

              const voiceConnectionModule = WebpackModules.getByProps("hasVideo", "disconnect", "isConnected");
              this.disconnectPatcher = BdApi.Patcher.after("edoStereo", voiceConnectionModule, "disconnect", () => {
                this.justJoined = false;
              });

              if (this.settings.otherSettings.enableSpotifyPauseBlocker) {
                this.enableSpotifyPauseBlocker();
              }
            }

            enableSpotifyPauseBlocker() { // added
              XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;

              const myOpen = function(method, url, async, user, password) {
                if (url === "https://api.spotify.com/v1/me/player/pause") {
                  url = "https://api.spotify.com/v1/me/player/play";
                }
                this.realOpen(method, url, async, user, password);
              };

              XMLHttpRequest.prototype.open = myOpen;

              const hidePopup = () => {
                const popup = document.querySelector('.popup-container.popup-show');
                if (popup) {
                  popup.style.display = 'none';
                }
              };

              this.hidePopupInterval = setInterval(hidePopup, 1000);

               this.showCustomToast("edoStereo: Spotify Pause Blocker Enabled", { type: "success", timeout: 6000 });
            }

            disableSpotifyPauseBlocker() {
              if (XMLHttpRequest.prototype.realOpen) {
                XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.realOpen;
                delete XMLHttpRequest.prototype.realOpen;
              }

              if (this.hidePopupInterval) {
                clearInterval(this.hidePopupInterval);
              }

              this.showCustomToast("edoStereo: Spotify Pause Blocker Disabled", { type: "warning", timeout: 6000 });
            }

            settingsWarning() {
              const voiceSettingsStore = WebpackModules.getByProps("getEchoCancellation");
              if (
                voiceSettingsStore.getNoiseSuppression() ||
                voiceSettingsStore.getNoiseCancellation() ||
                voiceSettingsStore.getEchoCancellation()
              ) {
                if (this.settings.enableToasts) {
                  Toasts.show(
                    "Please disable echo cancellation, noise reduction, and noise suppression for optimal edoStereo performance",
                    { type: "warning", timeout: 7000 }
                  );
                }
                return true;
              }
              return false;
            }

            onStop() {
              Patcher.unpatchAll();
              if (this.disconnectPatcher) this.disconnectPatcher();
              this.disableSpotifyPauseBlocker();
            }

            getSettingsPanel() {
              const panel = this.buildSettingsPanel();
              panel.addListener((id, value) => {
                if (id === "enableSpotifyPauseBlocker") {
                  if (value) {
                    this.enableSpotifyPauseBlocker();
                  } else {
                    this.disableSpotifyPauseBlocker();
                  }
                }
              });
              const noteElement = document.createElement("div");
              noteElement.className = "edoStereo-settings-note";
              noteElement.innerHTML = `
                <p style="color: #FF0000; margin-top: 10px;">Note: After changing any setting, please rejoin the voice channel for the changes to take effect.</p>
                <p style="color: #00FF00; margin-top: 5px;">Current settings: Channel ${this.settings.stereoChannelOption}, Bitrate ${parseInt(this.settings.bitrateOption)/1000}kbps, Spotify Pause Blocker: ${this.settings.otherSettings.enableSpotifyPauseBlocker ? "Enabled" : "Disabled"}</p>
              `;
              panel.getElement().append(noteElement);
              return panel.getElement();
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();
