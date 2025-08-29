import { Plugin, addIcon, PluginSettingTab, App, Setting } from 'obsidian';
import { ScanModal } from './scanModal';
import './styles.css';

interface MDCleanerSettings {
	debugOutput: boolean;
	runAtStartup: boolean;
	journalTemplate: string;
}

const DEFAULT_TEMPLATE = `## 📓 Journal  
**Morning Thoughts:**  
-  

**Midday Reflections:**  
-  

**Evening Summary:**  
-  


##### 🌜 Last night, after work, I...


##### 🙌 One thing I'm excited about right now is...


##### 🚀 One+ thing I plan to accomplish today is...


##### 👎 One thing I'm struggling with today is...

---
## 🧠 Brain Dump / Inbox  


--- 
## ✅ Tasks  
- [ ] 
#### Tasks Completed Yesterday: 
\`\`\`tasks 
done on yesterday
\`\`\`


---
## 😌 Mood  
- Emotion:  
- Energy level (1–10):  
- Notes:  


---

## 🛌 Sleep  
- Time Asleep:  
- Sleep Quality (1–10):  
- Wake Times:  
- Notes:


---
## 🏃 Fitness  
- Workout Type:  
- Duration (mins):  
- Intensity (1–10):  
- Steps:  
- Notes:


---`;

const DEFAULT_SETTINGS: MDCleanerSettings = {
	debugOutput: false,
	runAtStartup: false,
	journalTemplate: DEFAULT_TEMPLATE
}

export default class MDCleanerPlugin extends Plugin {
	settings: MDCleanerSettings;
	async onload() {
		await this.loadSettings();

		console.log('Loading FindZero - MD Cleaner plugin');

		// Define our custom markdown cleaner icon - trash can with markdown symbol
		addIcon('md-cleaner-icon', `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 6h18l-2 12H5L3 6z" stroke="currentColor" fill="none" stroke-width="1.5"/>
			<path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" stroke="currentColor" fill="none" stroke-width="1.5"/>
			<text x="12" y="13" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor">M↓</text>
		</svg>`);

		// Add a sidebar ribbon icon
		const ribbonIconEl = this.addRibbonIcon('md-cleaner-icon', 'MD Cleaner - Find Blank Notes', () => {
			const modal = new ScanModal(this.app, this.settings);
			modal.open();
		});
		
		ribbonIconEl.addClass('md-cleaner-ribbon-class');

		// Add a command to scan and delete markdown files
		this.addCommand({
			id: 'scan-and-delete-md-files',
			name: 'Scan & Delete Blank Notes',
			callback: () => {
				const modal = new ScanModal(this.app, this.settings);
				modal.open();
			}
		});

		// Add settings tab
		this.addSettingTab(new MDCleanerSettingTab(this.app, this));

		// Run at startup if enabled
		if (this.settings.runAtStartup) {
			// Wait a bit for Obsidian to fully load
			setTimeout(() => {
				const modal = new ScanModal(this.app, this.settings);
				modal.open();
			}, 2000);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		console.log('Unloading FindZero - MD Cleaner plugin');
	}
}

class MDCleanerSettingTab extends PluginSettingTab {
	plugin: MDCleanerPlugin;

	constructor(app: App, plugin: MDCleanerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'FindZero - MD Cleaner Settings'});

		new Setting(containerEl)
			.setName('Debug Output')
			.setDesc('Show debug information in the developer console')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debugOutput)
				.onChange(async (value) => {
					this.plugin.settings.debugOutput = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Run at Startup')
			.setDesc('Automatically open the scan modal when Obsidian starts')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.runAtStartup)
				.onChange(async (value) => {
					this.plugin.settings.runAtStartup = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Journal Template')
			.setDesc('The template text to match when identifying unfilled journal files. This should be the exact text structure of your empty journal template.')
			.addTextArea(text => {
				const textArea = text
					.setPlaceholder('Enter your journal template here...')
					.setValue(this.plugin.settings.journalTemplate)
					.onChange(async (value) => {
						this.plugin.settings.journalTemplate = value;
						await this.plugin.saveSettings();
					});
				
				// Make the text area bigger
				textArea.inputEl.rows = 20;
				textArea.inputEl.cols = 80;
				textArea.inputEl.style.minHeight = '400px';
				textArea.inputEl.style.width = '100%';
				textArea.inputEl.style.fontFamily = 'monospace';
				
				return textArea;
			});

		// Add a button to reset template to default
		new Setting(containerEl)
			.setName('Reset Template to Default')
			.setDesc('Restore the journal template to the original default template')
			.addButton(button => button
				.setButtonText('Reset to Default')
				.onClick(async () => {
					this.plugin.settings.journalTemplate = DEFAULT_TEMPLATE;
					await this.plugin.saveSettings();
					// Refresh the display to show the reset value
					this.display();
				}));
	}
}