import { Plugin, addIcon } from 'obsidian';
import { ScanModal } from './scanModal';
import './styles.css';

export default class MDCleanerPlugin extends Plugin {
	async onload() {
		console.log('Loading FindZero - MD Cleaner plugin');

		// Define our custom broom icon with a properly formatted SVG path
		addIcon('broom-icon', `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L10 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2 19L4 17L8 17L10 19L2 19Z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);

		// Add a sidebar ribbon icon
		const ribbonIconEl = this.addRibbonIcon('broom-icon', 'MD Cleaner - Find Blank Notes', () => {
			const modal = new ScanModal(this.app);
			modal.open();
		});
		
		ribbonIconEl.addClass('md-cleaner-ribbon-class');

		// Add a command to scan and delete markdown files
		this.addCommand({
			id: 'scan-and-delete-md-files',
			name: 'Scan & Delete Blank Notes',
			callback: () => {
				const modal = new ScanModal(this.app);
				modal.open();
			}
		});
	}

	onunload() {
		console.log('Unloading FindZero - MD Cleaner plugin');
	}
}