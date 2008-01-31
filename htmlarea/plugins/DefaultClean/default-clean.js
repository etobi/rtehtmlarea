/***************************************************************
*  Copyright notice
*
*  (c) 2008 Stanislas Rolland <stanislas.rolland(arobas)fructifor.ca>
*  All rights reserved
*
*  This script is part of the TYPO3 project. The TYPO3 project is
*  free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  The GNU General Public License can be found at
*  http://www.gnu.org/copyleft/gpl.html.
*  A copy is found in the textfile GPL.txt and important notices to the license
*  from the author is found in LICENSE.txt distributed with these scripts.
*
*
*  This script is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/
/**
 * Default Clean Plugin for TYPO3 htmlArea RTE
 *
 * TYPO3 SVN ID: $Id: default-clean.js 2663 2007-11-05 09:22:23Z ingmars $
 */
DefaultClean = HTMLArea.Plugin.extend({
	
	constructor : function(editor, pluginName) {
		this.base(editor, pluginName);
	},
	
	/*
	 * This function gets called by the class constructor
	 */
	configurePlugin : function(editor) {
		
		this.pageTSConfiguration = this.editorConfiguration.buttons.cleanword;
		this.cleanLaterFunctRef = this.makeFunctionReference("cleanLater");
		
		/*
		 * Registering plugin "About" information
		 */
		var pluginInformation = {
			version		: "1.0",
			developer	: "Stanislas Rolland",
			developerUrl	: "http://www.fructifor.ca/",
			copyrightOwner	: "Stanislas Rolland",
			sponsor		: "Fructifor Inc.",
			sponsorUrl	: "http://www.fructifor.ca/",
			license		: "GPL"
		};
		this.registerPluginInformation(pluginInformation);
		
		/*
		 * Registering the (hidden) button
		 */
		var buttonId = "CleanWord";
		var buttonConfiguration = {
			id		: buttonId,
			tooltip		: this.localize(buttonId + "-Tooltip"),
			action		: "onButtonPress",
			hide		: true
		};
		this.registerButton(buttonConfiguration);
	},
	
	/*
	 * This function gets called when the button was pressed.
	 *
	 * @param	object		editor: the editor instance
	 * @param	string		id: the button id or the key
	 *
	 * @return	boolean		false if action is completed
	 */
	onButtonPress : function (editor, id, target) {
			// Could be a button or its hotkey
		var buttonId = this.translateHotKey(id);
		buttonId = buttonId ? buttonId : id;
		
		this.clean(this.editor._doc.body);
		return false;
	},
	
	onGenerate : function () {
		var doc = this.editor._doc;
		var cleanFunctRef = this.makeFunctionReference("wordCleanHandler");
		HTMLArea._addEvents((HTMLArea.is_ie ? doc.body : doc), ["paste","dragdrop","drop"], cleanFunctRef, true);
	},
	
	clean : function (html) {
		function clearClass(node) {
			var newc = node.className.replace(/(^|\s)mso.*?(\s|$)/ig,' ');
			if(newc != node.className) {
				node.className = newc;
				if(!/\S/.test(node.className)) node.removeAttribute("className");
			}
		}
		function clearStyle(node) {
			if (HTMLArea.is_ie) var style = node.style.cssText;
				else var style = node.getAttribute("style");
			if (style) {
				var declarations = style.split(/\s*;\s*/);
				for (var i = declarations.length; --i >= 0;) {
					if(/^mso|^tab-stops/i.test(declarations[i]) || /^margin\s*:\s*0..\s+0..\s+0../i.test(declarations[i])) declarations.splice(i,1);
				}
				node.setAttribute("style", declarations.join("; "));
			}
		}
		function stripTag(el) {
			if(HTMLArea.is_ie) {
				el.outerHTML = HTMLArea.htmlEncode(el.innerText);
			} else {
				var txt = document.createTextNode(HTMLArea.getInnerText(el));
				el.parentNode.insertBefore(txt,el);
				el.parentNode.removeChild(el);
			}
		}
		function checkEmpty(el) {
			if(/^(span|b|strong|i|em|font)$/i.test(el.tagName) && !el.firstChild) el.parentNode.removeChild(el);
		}
		function parseTree(root) {
			var tag = root.tagName.toLowerCase(), i, next;
			if((HTMLArea.is_ie && root.scopeName != 'HTML') || (!HTMLArea.is_ie && /:/.test(tag)) || /o:p/.test(tag)) {
				stripTag(root);
				return false;
			} else {
				clearClass(root);
				clearStyle(root);
				for (i=root.firstChild;i;i=next) {
					next = i.nextSibling;
					if(i.nodeType == 1 && parseTree(i)) { checkEmpty(i); }
				}
			}
			return true;
		}
		parseTree(html);
	},
	
	cleanLater : function () {
		this.clean(this.editor._doc.body);
		if (this.doUpdateToolbar) {
			this.editor.updateToolbar();
		}
		this.doUpdateToolbar = false;
	},
	
	/*
	* Handler for paste, dragdrop and drop events
	*/
	wordCleanHandler : function (ev) {
		if(!ev) var ev = window.event;
		var target = (ev.target) ? ev.target : ev.srcElement;
		var owner = (target.ownerDocument) ? target.ownerDocument : target;
		while (HTMLArea.is_ie && owner.parentElement ) { // IE5.5 does not report any ownerDocument
			owner = owner.parentElement;
		}
			// If we dropped an image dragged from the TYPO3 Image plugin, let's close the dialog window
		if (typeof(HTMLArea.Dialog) != "undefined" && HTMLArea.Dialog.TYPO3Image) {
			HTMLArea.Dialog.TYPO3Image.close();
		} else {
			this.doUpdateToolbar = false;
			window.setTimeout(this.cleanLaterFunctRef, 250);
		}
	}
});
