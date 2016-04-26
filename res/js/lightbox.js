//  ###########################################################################################################################
//
// BEN: Added this whole block to be able to initialise the lightbox BEFORE loading of ALL page-content is finished
//
// written by Dean Edwards, 2005
// with input from Tino Zijdel, Matthias Miller, Diego Perini
// http://dean.edwards.name/weblog/2005/10/add-event/
// 2007-07-10 TKO - Removed check for body in schedule because of problems with Firefox 2.0

function addEvent(element, type, handler) {
	// Modification by Tanny O'Haley, http://tanny.ica.com to add the
	// DOMContentLoaded for all browsers.
	if (type == "DOMContentLoaded" || type == "domload") {
		addDOMLoadEvent(handler);
		return;
	}
	
	if (element.addEventListener) {
		element.addEventListener(type, handler, false);
	} else {
		// assign each event handler a unique ID
		if (!handler.$$guid) {
			handler.$$guid = addEvent.guid++;
		}
		// create a hash table of event types for the element
		if (!element.events) {
			element.events = {};
		}
		// create a hash table of event handlers for each element/event pair
		var handlers = element.events[type];
		if (!handlers) {
			handlers = element.events[type] = {};
			// store the existing event handler (if there is one)
			if (element["on" + type]) {
				handlers[0] = element["on" + type];
			}
		}
		// store the event handler in the hash table
		handlers[handler.$$guid] = handler;
		// assign a global event handler to do all the work
		element["on" + type] = handleEvent;
	}
};
// a counter used to create unique IDs
addEvent.guid = 1;

function removeEvent(element, type, handler) {
	if (element.removeEventListener) {
		element.removeEventListener(type, handler, false);
	} else {
		// delete the event handler from the hash table
		if (element.events && element.events[type]) {
			delete element.events[type][handler.$$guid];
		}
	}
};

function handleEvent(event) {
	var returnValue = true;
	// grab the event object (IE uses a global event object)
	event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
	// get a reference to the hash table of event handlers
	var handlers = this.events[event.type];
	// execute each event handler
	for (var i in handlers) {
		this.$$handleEvent = handlers[i];
		if (this.$$handleEvent(event) === false) {
			returnValue = false;
		}
	}
	return returnValue;
};

function fixEvent(event) {
	// add W3C standard event methods
	event.preventDefault = fixEvent.preventDefault;
	event.stopPropagation = fixEvent.stopPropagation;
	return event;
};
fixEvent.preventDefault = function() {
	this.returnValue = false;
};
fixEvent.stopPropagation = function() {
	this.cancelBubble = true;
};

// End Dean Edwards addEvent.

// Tino Zijdel - crisp@xs4all.nl This little snippet fixes the problem that the onload attribute on 
// the body-element will overwrite previous attached events on the window object for the onload event.
if (!window.addEventListener) {
	document.onreadystatechange = function(){
		if (window.onload && window.onload != handleEvent) {
			addEvent(window, 'load', window.onload);
			window.onload = handleEvent;
		}
	}
}

// Here are my functions for adding the DOMContentLoaded event to browsers other
// than Mozilla.

// Array of DOMContentLoaded event handlers.
window.onDOMLoadEvents = new Array();
window.DOMContentLoadedInitDone = false;

// Function that adds DOMContentLoaded listeners to the array.
function addDOMLoadEvent(listener) {
	window.onDOMLoadEvents[window.onDOMLoadEvents.length]=listener;
}

// Function to process the DOMContentLoaded events array.
function DOMContentLoadedInit() {
	// quit if this function has already been called
	if (window.DOMContentLoadedInitDone) {
		return;
	}

	// flag this function so we don't do the same thing twice
	window.DOMContentLoadedInitDone = true;

	// iterates through array of registered functions 
	for (var i=0; i<window.onDOMLoadEvents.length; i++) {
		var func = window.onDOMLoadEvents[i];
		func();
	}
}

function DOMContentLoadedScheduler() {
	// quit if the init function has already been called
	if (window.DOMContentLoadedInitDone) {
		return true;
	}
	
	// First, check for Safari or KHTML.
	// Second, check for IE.

	//if DOM methods are supported, and the body element exists
	//(using a double-check including document.body, for the benefit of older moz builds [eg ns7.1] 
	//in which getElementsByTagName('body')[0] is undefined, unless this script is in the body section)
	if(/KHTML|WebKit/i.test(navigator.userAgent)) {
		if(/loaded|complete/.test(document.readyState)) {
			DOMContentLoadedInit();
		} else {
			// Not ready yet, wait a little more.
			setTimeout("DOMContentLoadedScheduler()", 250);
		}
	} else if(document.getElementById("__ie_onload")) {
		return true;
	}

	// Check for custom developer provided function.
	if(typeof DOMContentLoadedCustom == "function") {
		if(typeof document.getElementsByTagName != 'undefined' && (document.getElementsByTagName('body')[0] != null || document.body != null)) {
			// Call custom function.
			if(DOMContentLoadedCustom()) {
				DOMContentLoadedInit();
			} else {
				// Not ready yet, wait a little more.
				setTimeout("DOMContentLoadedScheduler()", 250);
			}
		}
	}
	return true;
}

// Schedule to run the init function.
setTimeout("DOMContentLoadedScheduler()", 250);

// Just in case window.onload happens first, add it there too.
addEvent(window, "load", DOMContentLoadedInit);

// If addEventListener supports the DOMContentLoaded event.
if(document.addEventListener) {
	document.addEventListener("DOMContentLoaded", DOMContentLoadedInit, false);
}

/* for Internet Explorer */
if (navigator.appName == "Microsoft Internet Explorer") {
	document.write("<script id=__ie_onload defer src=\"//:\"><\/script>");
	var script = document.getElementById("__ie_onload");
	script.onreadystatechange = function() {
		if (this.readyState == "complete") {
			DOMContentLoadedInit(); // call the onload handler
		}
	};
}
//  ###########################################################################################################################

// -----------------------------------------------------------------------------------
//
//	Lightbox v2.03.3
//	by Lokesh Dhakar - http://www.huddletogether.com
//	5/21/06
//
//	For more information on this script, visit:
//	http://huddletogether.com/projects/lightbox2/
//
//	Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
//	
//	Credit also due to those who have helped, inspired, and made their code available to the public.
//	Including: Scott Upton(uptonic.com), Peter-Paul Koch(quirksmode.com), Thomas Fuchs(mir.aculo.us), and others.
//
//  ###########################################################################################################################
//
//  BEN: Modified for better integration with a CMS
//  Added options to save the displayed image as well as a presentation mode
//  Added a slideshow option (inspired by LyteBox v3.20, Markus F. Hay, http://www.dolem.com/lytebox)
//  VERY MANY THANKS to Lokesh Dhakar for the basic script!
//
//  ###########################################################################################################################
//
// -----------------------------------------------------------------------------------
/*

	Table of Contents
	-----------------
	Configuration
	Global Variables

	Extending Built-in Objects	
	- Object.extend(Element)
	- Array.prototype.removeDuplicates()
	- Array.prototype.empty()

	Lightbox Class Declaration
	- initialize()
	- updateImageList()
	- start()
	- changeImage()
	- resizeImageContainer()
	- showImage()
	- updateDetails()
	- updateNav()
	// ###########################################################################################################################
	- updatePresentationNav()
	- startSlideshow()
	- stopSlideshow()
	// ###########################################################################################################################
	- enableKeyboardNav()
	- disableKeyboardNav()
	- keyboardAction()
	- preloadNeighborImages()
	- end()
	
	Miscellaneous Functions
	- getPageScroll()
	- getPageSize()
	- getKey()
	- listenKey()
	- showSelectBoxes()
	- hideSelectBoxes()
	- showFlash()
	- hideFlash()
	- pause()
	- initLightbox()
	
	Function Calls
	- addLoadEvent(initLightbox)
	
*/
// -----------------------------------------------------------------------------------

//
//	Configuration
//
// ###########################################################################################################################
//
// BEN: Out here. In css now.
// var fileLoadingImage = "img/loading.gif";		
// var fileBottomNavCloseImage = "img/closelabel.gif";
// ###########################################################################################################################

var overlayOpacity = 0.8; // Controls transparency of shadow overlay

var animate = true; // Toggles resizing animations
var resizeSpeed = 400; // Controls the speed of the image resizing animations (in milliseconds)

var borderSize = 10; // If you adjust the padding in the CSS, you will need to update this variable


// ###########################################################################################################################
//
// BEN: Adding vars for localisation and presentation mode, added prev-, and nextLink-images here.
// Added var to allow saving of images and appropriate button.
// Added slideshow option and vars.
//
var lllImage = 'Image';
var lllOf = 'of';

var presentationMode; //Set during link-parsing

var allowSave = false;

var slideshowEnabled; // Set during link-parsing
var enableSlideshowAutoplay = false; // Is a slideshow active from the start?
var slideshowInterval = 5000; // Time in milliseconds before the images change during a slideshow
var slideshowAutoclose = false; // Should the lightbox be closed when the slideshow reaches the last image?
// ###########################################################################################################################


// -----------------------------------------------------------------------------------

//
//	Global Variables
//
var imageArray = new Array;
var activeImage;

// ###########################################################################################################################
//
// BEN: Adding vars for the slideshow
//
var slideshowActive; // Set during link-parsing
var slideshowIDArray = new Array();
var slideshowIDCount = 0;
// ###########################################################################################################################

// -----------------------------------------------------------------------------------

//
//	Additional methods for Element added by SU, Couloir
//	- further additions by Lokesh Dhakar (huddletogether.com)
//
Object.extend(Element, {
	getWidth: function(element) {
	   	element = $(element);
	   	return element.offsetWidth; 
	},
	setWidth: function(element,w) {
	   	element = $(element);
    	element.style.width = w +"px";
	},
	setHeight: function(element,h) {
   		element = $(element);
    	element.style.height = h +"px";
	},
	setTop: function(element,t) {
	   	element = $(element);
    	element.style.top = t +"px";
	},
	setLeft: function(element,l) {
	   	element = $(element);
    	element.style.left = l +"px";
	},
	setSrc: function(element,src) {
    	element = $(element);
    	element.src = src; 
	},
	setHref: function(element,href) {
    	element = $(element);
    	element.href = href; 
	},
	setInnerHTML: function(element,content) {
		element = $(element);
		element.innerHTML = content;
	}
});

// -----------------------------------------------------------------------------------

//
//	Extending built-in Array object
//	- array.removeDuplicates()
//	- array.empty()
//
// BEN: Theres a prototype method that can do this!
/*Array.prototype.removeDuplicates = function () {
    for(i = 0; i < this.length; i++){
        for(j = this.length-1; j>i; j--){        
            if(this[i][0] == this[j][0]){
                this.splice(j,1);
            }
        }
    }
}*/

// -----------------------------------------------------------------------------------

// BEN: Seems that this is not used in the whole script!!!
/*Array.prototype.empty = function () {
	for(i = 0; i <= this.length; i++){
		this.shift();
	}
}*/

// -----------------------------------------------------------------------------------

//
//	Lightbox Class Declaration
//	- initialize()
//	- start()
//	- changeImage()
//	- resizeImageContainer()
//	- showImage()
//	- updateDetails()
//	- updateNav()
//  ###########################################################################################################################
//  - updatePresentationNav()
//  - startSlideshow()
//  - stopSlideshow()
//  ###########################################################################################################################
//	- enableKeyboardNav()
//	- disableKeyboardNav()
//	- keyboardNavAction()
//	- preloadNeighborImages()
//	- end()
//
//	Structuring of code inspired by Scott Upton (http://www.uptonic.com/)
//
var Lightbox = Class.create();

Lightbox.prototype = {
	
	// initialize()
	// Constructor runs on completion of the DOM loading. Calls updateImageList and then
	// the function inserts html at the bottom of the page which is used to display the shadow 
	// overlay and the image container.
	//
	initialize: function() {
			
		// ###########################################################################################################################
		//
		// BEN: This was originally under "Global Variables" but it needs to be here so that it's not overwritten via inline scripts!
		// NOTE: resizeSpeed was changed to be passed in ms, so we need to recalculate a bit here... (for compatibility with slimbox vars!)
		//	
		if(animate == true){
			//overlayDuration = 0.2;	// shadow fade in/out duration
			//if(resizeSpeed > 10){ resizeSpeed = 10;}
			//if(resizeSpeed < 1){ resizeSpeed = 1;}
			//resizeDuration = (11 - resizeSpeed) * 0.15;
			overlayDuration = resizeSpeed/1000;
			resizeDuration = resizeSpeed/1000;
		} else { 
			overlayDuration = 0;
			resizeDuration = 0;
		}
		// ###########################################################################################################################
		
		this.updateImageList();

		// Code inserts html at the bottom of the page that looks similar to this:
		//
		//	<div id="overlay"></div>
		//	<div id="lightbox">
		//		<div id="outerImageContainer">
		//			<div id="imageContainer">
		//				<img id="lightboxImage">
		//				<div style="" id="hoverNav">
		//					<a href="#" id="prevLink"></a>
		//					<a href="#" id="nextLink"></a>
		//				</div>
		//				<div id="loading">
		//					<a href="#" id="loadingLink">
		//						<img src="images/loading.gif">
		//					</a>
		//				</div>
		//			</div>
		//		</div>
		//		<div id="imageDataContainer">
		//			<div id="imageData">
		//				<div id="imageDetails">
		//					<span id="caption"></span>
		//					<span id="numberDisplay"></span>
		//				</div>
		//				<div id="bottomNav">
		//					<a href="#" id="bottomNavClose">
		//						<img src="images/close.gif">
		//					</a>
		//				</div>
		//			</div>
		//		</div>
		//	</div>


		var objBody = document.getElementsByTagName("body").item(0);
		
		var objOverlay = document.createElement("div");
		objOverlay.setAttribute('id','overlay');
		objOverlay.style.display = 'none';
		objOverlay.onclick = function() { myLightbox.end(); }
		objBody.appendChild(objOverlay);
		
		var objLightbox = document.createElement("div");
		objLightbox.setAttribute('id','lbLightbox');
		objLightbox.style.display = 'none';
		objLightbox.onclick = function(e) {	// close Lightbox is user clicks shadow overlay
			if (!e) var e = window.event;
			var clickObj = Event.element(e).id;
			if ( clickObj == 'lbLightbox') {
				myLightbox.end();
			}
		};
		objBody.appendChild(objLightbox);
			
		var objOuterImageContainer = document.createElement("div");
		objOuterImageContainer.setAttribute('id','lbOuterImageContainer');
		objLightbox.appendChild(objOuterImageContainer);

		// When Lightbox starts it will resize itself from 250 by 250 to the current image dimension.
		// If animations are turned off, it will be hidden as to prevent a flicker of a
		// white 250 by 250 box.
		if(animate){
			Element.setWidth('lbOuterImageContainer', 250);
			Element.setHeight('lbOuterImageContainer', 250);			
		} else {
			Element.setWidth('lbOuterImageContainer', 1);
			Element.setHeight('lbOuterImageContainer', 1);			
		}

		var objImageContainer = document.createElement("div");
		objImageContainer.setAttribute('id','lbImageContainer');
		objOuterImageContainer.appendChild(objImageContainer);
	
		var objLightboxImage = document.createElement("img");
		objLightboxImage.setAttribute('id','lightboxImage');
		objImageContainer.appendChild(objLightboxImage);
	
		var objHoverNav = document.createElement("div");
		objHoverNav.setAttribute('id','lbHoverNav');
		objImageContainer.appendChild(objHoverNav);
	
		var objPrevLink = document.createElement("a");
		objPrevLink.setAttribute('id','prevLink');
		objPrevLink.setAttribute('href','#');		
		objHoverNav.appendChild(objPrevLink);			
		
		var objNextLink = document.createElement("a");
		objNextLink.setAttribute('id','nextLink');
		objNextLink.setAttribute('href','#');
		objHoverNav.appendChild(objNextLink);
		
		var objLoading = document.createElement("div");
		objLoading.setAttribute('id','lbLoading');
		objImageContainer.appendChild(objLoading);
	
		var objLoadingLink = document.createElement("a");
		objLoadingLink.setAttribute('id','loadingLink');
		objLoadingLink.setAttribute('href','#');
		objLoadingLink.onclick = function() { myLightbox.end(); return false; }
		objLoading.appendChild(objLoadingLink);

		var objImageDataContainer = document.createElement("div");
		objImageDataContainer.setAttribute('id','lbImageDataContainer');
		objLightbox.appendChild(objImageDataContainer);

		var objImageData = document.createElement("div");
		objImageData.setAttribute('id','lbImageData');
		objImageDataContainer.appendChild(objImageData);
	
		var objImageDetails = document.createElement("div");
		objImageDetails.setAttribute('id','lbImageDetails');
		objImageData.appendChild(objImageDetails);
	
		var objCaption = document.createElement("span");
		objCaption.setAttribute('id','lbCaption');
		objImageDetails.appendChild(objCaption);
	
		var objNumberDisplay = document.createElement("span");
		objNumberDisplay.setAttribute('id','lbNumber');
		objImageDetails.appendChild(objNumberDisplay);
		
		// ###########################################################################################################################
		//
		// BEN: Adding element for the display of presentation mode
		//
		var objPresentMode = document.createElement("span");
		objPresentMode.setAttribute('id','lbPresent');
		objImageDetails.appendChild(objPresentMode);
		// ###########################################################################################################################
		
		var objBottomNav = document.createElement("div");
		objBottomNav.setAttribute('id','bottomNav');
		objImageData.appendChild(objBottomNav);
		
		// ###########################################################################################################################
		//
		// BEN: Adding play/pause buttons for the slideshow
		//
		var objBottomNavPlayLink = document.createElement("a");
		objBottomNavPlayLink.setAttribute('id','playLink');
		objBottomNavPlayLink.setAttribute('href','#');
		objBottomNavPlayLink.onclick = function() { myLightbox.startSlideshow(); return false; }
		objBottomNav.appendChild(objBottomNavPlayLink);
		
		var objBottomNavPauseLink = document.createElement("a");
		objBottomNavPauseLink.setAttribute('id','pauseLink');
		objBottomNavPauseLink.setAttribute('href','#');
		objBottomNavPauseLink.onclick = function() { myLightbox.stopSlideshow(); return false; }
		objBottomNav.appendChild(objBottomNavPauseLink);
		// ###########################################################################################################################
		
		// ###########################################################################################################################
		//
		// BEN: Adding a save-button if saving is allowed
		//
		if (allowSave) {
			var objBottomNavSaveLink = document.createElement("a");
			objBottomNavSaveLink.setAttribute('id','saveLink');
			objBottomNavSaveLink.setAttribute('target','_blank');
			objBottomNav.appendChild(objBottomNavSaveLink);
		}
		// ###########################################################################################################################
		
		var objBottomNavCloseLink = document.createElement("a");
		objBottomNavCloseLink.setAttribute('id','closeLink');
		objBottomNavCloseLink.setAttribute('href','#');
		objBottomNavCloseLink.onclick = function() { myLightbox.end(); return false; }
		objBottomNav.appendChild(objBottomNavCloseLink);
	},


	//
	// updateImageList()
	// Loops through anchor tags looking for 'lightbox' references and applies onclick
	// events to appropriate links. You can rerun after dynamically adding images w/ajax.
	//
	updateImageList: function() {	
		if (!document.getElementsByTagName){ return; }
		var anchors = document.getElementsByTagName('a');
		var areas = document.getElementsByTagName('area');

		// loop through all anchor tags
		for (var i=0; i<anchors.length; i++){
			var anchor = anchors[i];
			
			var relAttribute = String(anchor.getAttribute('rel'));
			
			// use the string.match() method to catch 'lightbox' references in the rel attribute
			if (anchor.getAttribute('href') && (relAttribute.toLowerCase().match('lightbox'))){
				anchor.onclick = function () {myLightbox.start(this); return false;}
			}
		}

		// loop through all area tags
		// todo: combine anchor & area tag loops
		for (var i=0; i< areas.length; i++){
			var area = areas[i];
			
			var relAttribute = String(area.getAttribute('rel'));
			
			// use the string.match() method to catch 'lightbox' references in the rel attribute
			if (area.getAttribute('href') && (relAttribute.toLowerCase().match('lightbox'))){
				area.onclick = function () {myLightbox.start(this); return false;}
			}
		}
	},
	
	
	//
	//	start()
	//	Display overlay and lightbox. If image is part of a set, add siblings to imageArray.
	//
	start: function(imageLink) {
		
		hideSelectBoxes();
		hideFlash();

		// stretch overlay to fill page and fade in
		var arrayPageSize = getPageSize();
		
		// ###########################################################################################################################
		// BEN: The setting of the width is not necessary as it's set to 100% in css. If user resizes browser during lightshow it breaks.
		//Element.setWidth('overlay', arrayPageSize[0]);
		Element.setHeight('overlay', arrayPageSize[1]);
		// ###########################################################################################################################

		new Effect.Appear('overlay', { duration: overlayDuration, from: 0.0, to: overlayOpacity });

		imageArray = [];
		imageNum = 0;		

		if (!document.getElementsByTagName){ return; }
		var anchors = document.getElementsByTagName( imageLink.tagName);

		// if image is NOT part of a set..
		if((imageLink.getAttribute('rel') == 'lightbox')){
			// add single image to imageArray
			imageArray.push(new Array(imageLink.getAttribute('href'), imageLink.getAttribute('title')));
			
			// ###########################################################################################################################
			//
			// BEN: Make sure the presentation mode and/or slideshow is disabled for single images!
			//
			presentationMode = false;	
			slideshowEnabled = false;
			slideshowActive = false;
			$('pauseLink').hide();
			$('playLink').hide();
			// ###########################################################################################################################
		} else {
		// if image is part of a set..

			// loop through anchors, find other images in set, and add them to imageArray
			for (var i=0; i<anchors.length; i++){
				var anchor = anchors[i];
				if (anchor.getAttribute('href') && (anchor.getAttribute('rel') == imageLink.getAttribute('rel'))){
					imageArray.push(new Array(anchor.getAttribute('href'), anchor.getAttribute('title')));
				}
			}
			
			// ############### BEN: Changed this to the "normal" prototype function that exists for these things!
			// probably this is even not wanted!? Disable completely?
			//imageArray.removeDuplicates();
			//imageArray.uniq();
			while(imageArray[imageNum][0] != imageLink.getAttribute('href')) { imageNum++;}
			
			// ###########################################################################################################################
			//
			// BEN: Adding a search for 'present' here. If matched activate presentation mode otherwise reset to false
			// Added another search for 'slideshow' to activate slideshow
			//
			if(imageLink.getAttribute('rel').toLowerCase().match('present')){
				presentationMode = true;
			} else {
				presentationMode = false;
			}
			if(imageLink.getAttribute('rel').toLowerCase().match('slideshow')){
				slideshowEnabled = true;
				slideshowActive = enableSlideshowAutoplay;
			} else {
				slideshowEnabled = false;
				slideshowActive = false;
				$('pauseLink').hide();
				$('playLink').hide();
			}
			// ###########################################################################################################################
		}

		// calculate top and left offset for the lightbox 
		var arrayPageScroll = getPageScroll();
		var lightboxTop = arrayPageScroll[1] + (arrayPageSize[3] / 10);
		var lightboxLeft = arrayPageScroll[0];
		Element.setTop('lbLightbox', lightboxTop);
		Element.setLeft('lbLightbox', lightboxLeft);
		
		$('lbLightbox').show();
		
		this.changeImage(imageNum);	
	},

	//
	//	changeImage()
	//	Hide most elements and preload image in preparation for resizing image container.
	//
	changeImage: function(imageNum) {	
		
		activeImage = imageNum;	// update global var

		// hide elements during transition
		if(animate){ $('lbLoading').show();}
		$('lightboxImage').hide();
		$('lbHoverNav').hide();
		$('prevLink').hide();
		$('nextLink').hide();
		$('lbImageDataContainer').hide();
		$('lbNumber').hide();
		
		imgPreloader = new Image();
		
		// once image is preloaded, resize image container
		imgPreloader.onload=function(){
			Element.setSrc('lightboxImage', imageArray[activeImage][0]);
			myLightbox.resizeImageContainer(imgPreloader.width, imgPreloader.height);
			// ###########################################################################################################################
			//
			// BEN: Adding link to image if saving is allowed
			//
			if (allowSave) {
				document.getElementById('saveLink').setAttribute('href',imageArray[activeImage][0]);
			}
			// ###########################################################################################################################
			imgPreloader.onload=function(){};	//	clear onLoad, IE behaves irratically with animated gifs otherwise 
		}
		imgPreloader.src = imageArray[activeImage][0];		
	},

	//
	//	resizeImageContainer()
	//
	resizeImageContainer: function( imgWidth, imgHeight) {

		// get curren width and height
		this.widthCurrent = Element.getWidth('lbOuterImageContainer');
		this.heightCurrent = Element.getHeight('lbOuterImageContainer');

		// get new width and height
		var widthNew = (imgWidth  + (borderSize * 2));
		var heightNew = (imgHeight  + (borderSize * 2));

		// scalars based on change from old to new
		this.xScale = ( widthNew / this.widthCurrent) * 100;
		this.yScale = ( heightNew / this.heightCurrent) * 100;

		// calculate size difference between new and old image, and resize if necessary
		wDiff = this.widthCurrent - widthNew;
		hDiff = this.heightCurrent - heightNew;

		if(!( hDiff == 0)){ new Effect.Scale('lbOuterImageContainer', this.yScale, {scaleX: false, duration: resizeDuration, queue: 'front'}); }
		if(!( wDiff == 0)){ new Effect.Scale('lbOuterImageContainer', this.xScale, {scaleY: false, delay: resizeDuration, duration: resizeDuration}); }

		// if new and old image are same size and no scaling transition is necessary, 
		// do a quick pause to prevent image flicker.
		if((hDiff == 0) && (wDiff == 0)){
			if (navigator.appVersion.indexOf("MSIE")!=-1){ pause(250); } else { pause(100);} 
		}

		Element.setHeight('prevLink', imgHeight);	
		Element.setHeight('nextLink', imgHeight);
		Element.setWidth( 'lbImageDataContainer', widthNew);

		this.showImage();
	},
	
	//
	//	showImage()
	//	Display image and begin preloading neighbors.
	//
	showImage: function(){
		$('lbLoading').hide();
		new Effect.Appear('lightboxImage', { duration: resizeDuration, queue: 'end', afterFinish: function(){	myLightbox.updateDetails(); } });
		// ###########################################################################################################################
		//
		// BEN: Adding slideshow options
		//
		if (slideshowActive) {
			// If last image in set...
			if(activeImage == (imageArray.length -1)){
				// ...either shut down the lightbox if configured to do so...
				if(slideshowAutoclose) {
					slideshowIDArray[slideshowIDCount++] = setTimeout('myLightbox.end()',slideshowInterval+resizeSpeed*2);
				// ...or stop the slideshow
				} else {
					myLightbox.stopSlideshow();
				}					
			// If not last image in set, display next image in appropriate time
			} else {		
				slideshowIDArray[slideshowIDCount++] = setTimeout('myLightbox.changeImage('+(activeImage+1)+')',slideshowInterval+resizeSpeed*2);
			}
		}
		// ###########################################################################################################################
		this.preloadNeighborImages();
	},

	//
	//	updateDetails()
	//	Display caption, image number, and bottom nav.
	//
	updateDetails: function() {
	
		// if caption is not null
		if(imageArray[activeImage][1]){
			$('lbCaption').show();
			Element.setInnerHTML( 'lbCaption', imageArray[activeImage][1]);
		} else {
			$('lbCaption').hide();
		}
		
		// if image is part of set display 'Image x of x' 
		if(imageArray.length > 1){
			$('lbNumber').show();
			Element.setInnerHTML( 'lbNumber', " " + lllImage + " " + eval(activeImage + 1) + " " + lllOf + " " + imageArray.length);
		}
		
		// ###########################################################################################################################
		//
		// BEN: Adding presentation mode
		// Added slideshow controls
		//
		if(presentationMode){
			// Hide numberDisplay again
			$('lbNumber').hide();
			myLightbox.updatePresentationNav();
		} else {
			$('lbPresent').hide();
		}
		
		if(slideshowEnabled) {
			if(slideshowActive) {
				$('playLink').hide();
				$('pauseLink').show();	
			} else {
				$('pauseLink').hide();
				$('playLink').show();
			}
		}
		// ###########################################################################################################################

		new Effect.Parallel(
			[ new Effect.SlideDown( 'lbImageDataContainer', { sync: true, duration: resizeDuration, from: 0.0, to: 1.0 }), 
			  new Effect.Appear('lbImageDataContainer', { sync: true, duration: resizeDuration }) ], 
			{ duration: resizeDuration, afterFinish: function() {
				// update overlay size and update nav
				var arrayPageSize = getPageSize();
				Element.setHeight('overlay', arrayPageSize[1]);
				myLightbox.updateNav();
				}
			} 
		);
	},

	//
	//	updateNav()
	//	Display appropriate previous and next hover navigation.
	//
	updateNav: function() {

		$('lbHoverNav').show();				

		// if not first image in set, display prev image button
		if(activeImage != 0){
			$('prevLink').show();
			// ###########################################################################################################################
			//
			//	BEN: Stop slideshow if user manually interrupts
			//
			if (!slideshowActive) {
				// No slideshow -> normal behaviour
				document.getElementById('prevLink').onclick = function() {
					myLightbox.changeImage(activeImage - 1); return false;
				}
			} else {
				// Stop slideshow
				document.getElementById('prevLink').onclick = function() {
					myLightbox.stopSlideshow();
					myLightbox.changeImage(activeImage - 1);
					return false;
				}
			}
			// ###########################################################################################################################
		}

		// if not last image in set, display next image button
		if(activeImage != (imageArray.length - 1)){
			$('nextLink').show();
			// ###########################################################################################################################
			//
			//	BEN: Stop slideshow if user manually interrupts
			//
			if (!slideshowActive) {
				// No slideshow -> normal behaviour
				document.getElementById('nextLink').onclick = function() {
					myLightbox.changeImage(activeImage + 1); return false;
				}
			} else {
				// Stop slideshow
				document.getElementById('nextLink').onclick = function() {
					myLightbox.stopSlideshow();
					myLightbox.changeImage(activeImage + 1);
					return false;
				}
			}
		}
		
		this.enableKeyboardNav();
	},
	
	// ###########################################################################################################################
	//
	// BEN: updatePresentationNav()
	// Display presentation mode navigation
	// Added support for slideshow
	//
	updatePresentationNav: function() {		
		var content = '';
		for(var i=1; i<=(imageArray.length); i++){
			if((i-1) == activeImage){
				if(!slideshowActive){
					content += '<a class="act" href="#" id="pmi'+i+'" onClick="myLightbox.changeImage('+(i-1)+'); return false;">'+i+'</a> ';
				} else {
					content += '<a class="act" href="#" id="pmi'+i+'" onClick="myLightbox.stopSlideshow(); myLightbox.changeImage('+(i-1)+'); return false;">'+i+'</a> ';
				}
			} else {
				if (!slideshowActive){
					content += '<a class="no" href="#" id="pmi'+i+'" onClick="myLightbox.changeImage('+(i-1)+'); return false;">'+i+'</a> ';		
				} else {
					content += '<a class="no" href="#" id="pmi'+i+'" onClick="myLightbox.stopSlideshow(); myLightbox.changeImage('+(i-1)+'); return false;">'+i+'</a> ';
				}
			}
		}
		$('lbPresent').show();
		Element.setInnerHTML( 'lbPresent', content);
	},
	// ###########################################################################################################################

	// ###########################################################################################################################
	//
	// BEN: startSlideshow()
	// Sets global var slideshow to true, changes to next image to initialise timeouts, if it's the last image shut down the lightbox or start again from the first image
	//
	startSlideshow: function() {
		if(activeImage != (imageArray.length - 1)){
			slideshowActive = true;
			myLightbox.changeImage(activeImage + 1);
		} else {
			if(slideshowAutoclose) {
				myLightbox.end();
			} else {
				slideshowActive = true;
				myLightbox.changeImage(0);
			}
		}
	},
	// ###########################################################################################################################

	// ###########################################################################################################################
	//
	// BEN: stopSlideshow()
	// Sets global var slideshow to false, clears all timeouts, toggles visibility of play/pause-buttons
	//
	stopSlideshow: function() {	
		if(!slideshowActive){return false;}
		slideshowActive = false;
		for (var i=0;i<slideshowIDCount;i++) { window.clearTimeout(slideshowIDArray[i]);}
		$('pauseLink').hide();
		$('playLink').show();	
	},
	// ###########################################################################################################################

	//
	//	enableKeyboardNav()
	//
	enableKeyboardNav: function() {
		document.onkeydown = this.keyboardAction; 
	},

	//
	//	disableKeyboardNav()
	//
	disableKeyboardNav: function() {
		document.onkeydown = '';
	},

	//
	//	keyboardAction()
	//
	keyboardAction: function(e) {
		if (e == null) { // ie
			keycode = event.keyCode;
			escapeKey = 27;
		} else { // mozilla
			keycode = e.keyCode;
			escapeKey = e.DOM_VK_ESCAPE;
		}

		key = String.fromCharCode(keycode).toLowerCase();
		
		if((key == 'x') || (key == 'o') || (key == 'c') || (keycode == escapeKey)){	// close lightbox
			myLightbox.end();
		} else if((key == 'p') || (keycode == 37)){	// display previous image
			if(activeImage != 0){
				myLightbox.disableKeyboardNav();
				// ###########################################################################################################################
				//
				//	BEN: Stop slideshow if user manually interrupts
				//
				if(slideshowActive){
					myLightbox.stopSlideshow();
				}
				// ###########################################################################################################################
				myLightbox.changeImage(activeImage - 1);
			}
		} else if((key == 'n') || (keycode == 39)){	// display next image
			if(activeImage != (imageArray.length - 1)){
				myLightbox.disableKeyboardNav();
				// ###########################################################################################################################
				//
				//	BEN: Stop slideshow if user manually interrupts
				//
				if(slideshowActive){
					myLightbox.stopSlideshow();
				}
				// ###########################################################################################################################
				myLightbox.changeImage(activeImage + 1);
			}
		// ###########################################################################################################################
		//
		//	BEN: Adding keys for slideshow
		//
		} else if((key == 's') || (keycode == 83)){ // toggle slideshow on/off
			if(slideshowActive){
				myLightbox.stopSlideshow();
			} else {
				myLightbox.startSlideshow();
			}
		// ###########################################################################################################################
		}
	},

	//
	//	preloadNeighborImages()
	//	Preload previous and next images.
	//
	preloadNeighborImages: function(){

		if((imageArray.length - 1) > activeImage){
			preloadNextImage = new Image();
			preloadNextImage.src = imageArray[activeImage + 1][0];
		}
		if(activeImage > 0){
			preloadPrevImage = new Image();
			preloadPrevImage.src = imageArray[activeImage - 1][0];
		}
	
	},

	//
	//	end()
	//
	end: function() {
		this.disableKeyboardNav();
		$('lbLightbox').hide();
		new Effect.Fade('overlay', { duration: overlayDuration});
		showSelectBoxes();
		showFlash();
		// ###########################################################################################################################
		//
		//	BEN: If slideshow was active clear all timeouts
		//
		if (slideshowActive) {
			for (var i=0;i<slideshowIDCount;i++) { window.clearTimeout(slideshowIDArray[i]);}
			slideshowActive = false;
		}
		// ###########################################################################################################################
	}
}

// -----------------------------------------------------------------------------------

//
// getPageScroll()
// Returns array with x,y page scroll values.
// Core code from - quirksmode.com
//
function getPageScroll(){

	var xScroll, yScroll;

	if (self.pageYOffset) {
		yScroll = self.pageYOffset;
		xScroll = self.pageXOffset;
	} else if (document.documentElement && document.documentElement.scrollTop){	 // Explorer 6 Strict
		yScroll = document.documentElement.scrollTop;
		xScroll = document.documentElement.scrollLeft;
	} else if (document.body) {// all other Explorers
		yScroll = document.body.scrollTop;
		xScroll = document.body.scrollLeft;	
	}

	arrayPageScroll = new Array(xScroll,yScroll) 
	return arrayPageScroll;
}

// -----------------------------------------------------------------------------------

//
// getPageSize()
// Returns array with page width, height and window width, height
// Core code from - quirksmode.com
// Edit for Firefox by pHaez
//
function getPageSize(){
	
	var xScroll, yScroll;
	
	if (window.innerHeight && window.scrollMaxY) {	
		xScroll = window.innerWidth + window.scrollMaxX;
		yScroll = window.innerHeight + window.scrollMaxY;
	} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
		xScroll = document.body.scrollWidth;
		yScroll = document.body.scrollHeight;
	} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
		xScroll = document.body.offsetWidth;
		yScroll = document.body.offsetHeight;
	}
	
	var windowWidth, windowHeight;
	
//	console.log(self.innerWidth);
//	console.log(document.documentElement.clientWidth);

	if (self.innerHeight) {	// all except Explorer
		if(document.documentElement.clientWidth){
			windowWidth = document.documentElement.clientWidth; 
		} else {
			windowWidth = self.innerWidth;
		}
		windowHeight = self.innerHeight;
	} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
		windowWidth = document.documentElement.clientWidth;
		windowHeight = document.documentElement.clientHeight;
	} else if (document.body) { // other Explorers
		windowWidth = document.body.clientWidth;
		windowHeight = document.body.clientHeight;
	}	
	
	// for small pages with total height less then height of the viewport
	if(yScroll < windowHeight){
		pageHeight = windowHeight;
	} else { 
		pageHeight = yScroll;
	}

//	console.log("xScroll " + xScroll)
//	console.log("windowWidth " + windowWidth)

	// for small pages with total width less then width of the viewport
	if(xScroll < windowWidth){	
		pageWidth = xScroll;		
	} else {
		pageWidth = windowWidth;
	}
//	console.log("pageWidth " + pageWidth)

	arrayPageSize = new Array(pageWidth,pageHeight,windowWidth,windowHeight) 
	return arrayPageSize;
}

// -----------------------------------------------------------------------------------

//
// getKey(key)
// Gets keycode. If 'x' is pressed then it hides the lightbox.
//
function getKey(e){
	if (e == null) { // ie
		keycode = event.keyCode;
	} else { // mozilla
		keycode = e.which;
	}
	key = String.fromCharCode(keycode).toLowerCase();
	
	if(key == 'x'){
	}
}

// -----------------------------------------------------------------------------------

//
// listenKey()
//
function listenKey () {	document.onkeypress = getKey; }
	
// ---------------------------------------------------

function showSelectBoxes(){
	var selects = document.getElementsByTagName("select");
	for (i = 0; i != selects.length; i++) {
		selects[i].style.visibility = "visible";
	}
}

// ---------------------------------------------------

function hideSelectBoxes(){
	var selects = document.getElementsByTagName("select");
	for (i = 0; i != selects.length; i++) {
		selects[i].style.visibility = "hidden";
	}
}

// ---------------------------------------------------

function showFlash(){
	var flashObjects = document.getElementsByTagName("object");
	for (i = 0; i < flashObjects.length; i++) {
		flashObjects[i].style.visibility = "visible";
	}

	var flashEmbeds = document.getElementsByTagName("embed");
	for (i = 0; i < flashEmbeds.length; i++) {
		flashEmbeds[i].style.visibility = "visible";
	}
}

// ---------------------------------------------------

function hideFlash(){
	var flashObjects = document.getElementsByTagName("object");
	for (i = 0; i < flashObjects.length; i++) {
		flashObjects[i].style.visibility = "hidden";
	}

	var flashEmbeds = document.getElementsByTagName("embed");
	for (i = 0; i < flashEmbeds.length; i++) {
		flashEmbeds[i].style.visibility = "hidden";
	}

}


// ---------------------------------------------------

//
// pause(numberMillis)
// Pauses code execution for specified time. Uses busy code, not good.
// Help from Ran Bar-On [ran2103@gmail.com]
//

function pause(ms){
	var date = new Date();
	curDate = null;
	do{var curDate = new Date();}
	while( curDate - date < ms);
}
/*
function pause(numberMillis) {
	var curently = new Date().getTime() + sender;
	while (new Date().getTime();	
}
*/
// ---------------------------------------------------



function initLightbox() { myLightbox = new Lightbox(); }
//  ###########################################################################################################################
//
// BEN: This implements the very first block: initialise the lightbox when DOM is ready (which is much earlier than loading of the whole page)
//
//Event.observe(window, 'load', initLightbox, false);
addEvent(window,'DOMContentLoaded', initLightbox);
//  ###########################################################################################################################