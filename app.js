import fs from "node:fs";
import path from "node:path";

import dateformat from "dateformat";
import chalk from "chalk";

import {cutil} from "@ghasemkiani/base";
import {storable} from "@ghasemkiani/base-app";
import {App as AppBase} from "@ghasemkiani/base-app";
import {WDocument} from "@ghasemkiani/wjsdom";
import {Context as ContextBase} from "@ghasemkiani/dox";
import {Renderer as RendererBase} from "@ghasemkiani/dox";
import {tags as tagsCmn} from "@ghasemkiani/dox-cmn";

const df = date => dateformat(date, "yyyy-mm-dd HH:MM:ss");

class Context extends ContextBase {
	static {
		cutil.extend(this.prototype, {
			//
		});
	}
}

class Renderer extends RendererBase {
	static {
		cutil.extend(this.prototype, {
			Context,
			translator: {
				"urn:dox:cmn": tagsCmn,
			},
		});
	}
}

class App extends cutil.mixin(AppBase, storable) {
	static {
		cutil.extend(this.prototype, {
			prefsId: "doxer",
			defaultPrefs: {
				//
			},
			_renderer: null,
			verbose: null,
		});
	}
	async toDefineInitOptions() {
		await super.toDefineInitOptions();
		let app = this;
		app.commander.description("A simple document processor");
		app.commander.argument("<paths...>", "one or more files to process");
		app.commander.option("--clear", "Clear all prefs");
		app.commander.option("-v, --verbose", "Verbose output");
	}
	async toApplyInitOptions() {
		await super.toApplyInitOptions();
		let app = this;
		let opts = this.commander.opts();
		if (opts.clear) {
			app.prefs.clear();
			cutil.assign(app.prefs, app.defaultPrefs);
			app.prefs.save();
		}
		app.verbose = opts.verbose;
		await app.toProcess({paths: app.commander.args});
	}
	async toProcess({paths}) {
		let app = this;
		for (let fn of paths) {
			fn = fs.realpathSync(fn);
			let {dir: dirname, base: fname, name, ext} = path.parse(fn);
			let wdocument = new WDocument();
			let renderer = new Renderer({
				wdocument,
				setupContext(context) {
					cutil.assign(context, {dirname, fname});
				},
			});
			try {
				let fn = path.join(dirname, "index.xml");
				if (fs.existsSync(fn)) {
					await renderer.toRender(new WDocument({fn}).read().root);
				}
			} catch(e) {
				console.log(e.message);
			}
			await renderer.toRender(new WDocument({fn}).read().root);
			if (app.verbose) {
				console.log(wdocument.root.string);
			}
		}
	}
}

export {App};
