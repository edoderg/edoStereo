/**
 * @name edoStereo
 * @version 0.0.2
 * @author edo#0001
 * @authorId 269831113919299584
 * @source https://github.com/edoderg/edoStereo
 * @updateUrl https://github.com/edoderg/edoStereo/blob/main/edoStereo.plugin.js
 */
/*@cc_on
@if (@_jscript)

	// self-install für edoStereo
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
	var pathSelf = WScript.ScriptFullName;
	// User in First Person setzen
	shell.Popup("Direkt Gestartet... \n(Mach das nicht du Hs)", 0, "Stereo Plugin Fix für neue Discord Version", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("Ich bin bereits im richtigen Ordner.", 0, "Ich bin bereits installiert.", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("BetterDiscord nicht gefunden.\nInstalliert?", 0, "Kann nicht selbst installieren.", 0x10);
	} else if (shell.Popup("Kopie für das Plugin in den BetterDiscord Plugin Ordner?", 0, "Hilfe?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Zeigt User wo die Plugins sind
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("Installiert!", 0, "Erfolgreich installiert.", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"main":"index.js","info":{"name":"edoStereo","authors":[{"name":"edo#0001","discord_id":"269831113919299584"}],"version":"0.0.2","description":"[GER] Fügt Stereo Sound zu Discord hinzu. [ENG] Adds stereo sound to discord. Better Discord v1.8.4"},"changelog":[{"title":"Veränderungen","items":["BetterDiscord Stereo Sound für 1.8.4"]}],"defaultConfig":[{"type":"switch","id":"enableToasts","name":"Benachrichtung Aktivieren","note":"Warnung für Spracheinstellungsfeatures","value":true}]};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Fehlende BetterDiscord Library", `ZeresPluginLibrary fehlt. Klicke Jetzt Installieren um es runterzuladen.`, {
                confirmText: "Jetzt Installieren",
                cancelText: "Abbrechen",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
  const { WebpackModules, Patcher, Toasts } = Library;

  return class edoStereo extends Plugin {
    onStart() {
      this.settingsWarning();
      const voiceModule = WebpackModules.getModule(BdApi.Webpack.Filters.byPrototypeFields("updateVideoQuality"));
      BdApi.Patcher.after("edoStereo", voiceModule.prototype, "updateVideoQuality", (thisObj, _args, ret) => {
	  if(thisObj){
      const setTransportOptions = thisObj.conn.setTransportOptions;
      thisObj.conn.setTransportOptions = function (obj) {
        if (obj.audioEncoder) {
          obj.audioEncoder.params = {
            stereo: "8",
          };
          obj.audioEncoder.channels = 8;
        }
        if (obj.fec) {
          obj.fec = false;
        }
        if (obj.encodingVoiceBitRate < 384000 ) { //128
                obj.encodingVoiceBitRate = 512000; // annoying 4ss
        }

        setTransportOptions.call(thisObj, obj);
      };
      return ret;
	  }});
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
            "Schalte Hintergrundgeräusch Features von Discord aus. -> Spracheinstellungen.",
            { type: "warning", timeout: 5000 }
          );
        }
        // Geht nicht
        // const voiceSettings = WebpackModules.getByProps("setNoiseSuppression");
        // Analytics Edo
        // voiceSettings.setNoiseSuppression(false, {});
        // voiceSettings.setEchoCancellation(false, {});
        // voiceSettings.setNoiseCancellation(false, {});
        return true;
      } else return false;
    }

    onStop() {
      Patcher.unpatchAll();
    }
    getSettingsPanel() {
      const panel = this.buildSettingsPanel();
      return panel.getElement();
    }
  };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();


/*@end@*/
