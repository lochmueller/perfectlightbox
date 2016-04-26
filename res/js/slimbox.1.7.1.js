/*!
	Slimbox v1.71 - The ultimate lightweight Lightbox clone
	(c) 2007-2009 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/

var Slimbox = (function() {

	// Global variables, accessible to Slimbox only
	var win = window, ie6 = Browser.Engine.trident4, options, images, activeImage = -1, activeURL, prevImage, nextImage, compatibleOverlay, middle, centerWidth, centerHeight,

	// Preload images
	preload = {}, preloadPrev = new Image(), preloadNext = new Image(),

	/* BEN: */
	present, presentationMode, slideshowMode, slideshowActive, slideshowTimer, playLink, pauseLink, saveLink,
	/* :NEB */

	// DOM elements
	overlay, center, image, sizer, prevLink, nextLink, bottomContainer, bottom, caption, number,

	// Effects
	fxOverlay, fxResize, fxImage, fxBottom;

	/*
		Initialization
	*/

	win.addEvent('domready', function() {
		// Append the Slimbox HTML code at the bottom of the document
		$(document.body).adopt(
			$$(
				overlay = new Element('div', {id: 'sbOverlay', events: {click: close}}),
				center = new Element('div', {id: 'sbCenter'}),
				bottomContainer = new Element('div', {id: 'sbBottomContainer'})
			).setStyle('display', 'none')
		);

		image = new Element('div', {id: 'sbImage'}).injectInside(center).adopt(
			sizer = new Element('div', {styles: {position: 'relative'}}).adopt(
				prevLink = new Element('a', {id: 'prevLink', href: '#', events: {click: previous}}),
				nextLink = new Element('a', {id: 'nextLink', href: '#', events: {click: next}})
			)
		);

		bottom = new Element('div', {id: 'sbBottom'}).injectInside(bottomContainer).adopt(	
			new Element('a', {id: 'closeLink', href: '#', events: {click: close}}),
			/* BEN */
			playLink = new Element('a', {id: 'playLink', href: '#', events: {click: play}}),
			pauseLink = new Element('a', {id: 'pauseLink', href: '#', events: {click: pause}}),
			saveLink = new Element('a', {id: 'saveLink', href: '#', target: '_blank'}),
			/* :NEB */	
			caption = new Element('div', {id: 'sbCaption'}),
			number = new Element('div', {id: 'sbNumber'}),
			// BEN: Adding presentation mode
			present = new Element('div', {id: 'sbPresent'}),
			// :NEB
			new Element('div', {styles: {clear: 'both'}})
		);
	});


	/*
		Internal functions
	*/
	
    // BEN:
    // toInt(s)	
	// Failsafe version of parseInt()
    //
	function toInt(s) {
		return parseInt(s.replace(/\D/g,''));
	}
	// :NEB

	function position() {
		var scroll = win.getScroll(), size = win.getSize();
		$$(center, bottomContainer).setStyle('left', scroll.x + (size.x / 2));
		if (compatibleOverlay) overlay.setStyles({left: scroll.x, top: scroll.y, width: size.x, height: size.y});
	}

	function setup(open) {
		['object', ie6 ? 'select' : 'embed'].forEach(function(tag) {
			Array.forEach(document.getElementsByTagName(tag), function(el) {
				if (open) el._slimbox = el.style.visibility;
				el.style.visibility = open ? 'hidden' : el._slimbox;
			});
		});

		overlay.style.display = open ? '' : 'none';

		var fn = open ? 'addEvent' : 'removeEvent';
		win[fn]('scroll', position)[fn]('resize', position);
		document[fn]('keydown', keyDown);
	}

	function keyDown(event) {
		var code = event.code;
		// Prevent default keyboard action (like navigating inside the page)
		return options.closeKeys.contains(code) ? close()
			: options.nextKeys.contains(code) ? next()
			: options.previousKeys.contains(code) ? previous()
			/* BEN: Toggle slideshow */
			: options.slideshowKeys.contains(code) ? togglePlayPause()
			/* :NEB */
			: false;
	}

	function previous() {
		return changeImage(prevImage);
	}

	function next() {
		return changeImage(nextImage);
	}

	function changeImage(imageIndex) {
		if (imageIndex >= 0) {
			activeImage = imageIndex;
			activeURL = images[imageIndex][0];
			prevImage = (activeImage || (options.loop ? images.length : 0)) - 1;
			nextImage = ((activeImage + 1) % images.length) || (options.loop ? 0 : -1);

			stop();
			center.className = 'sbLoading';

			preload = new Image();
			preload.onload = animateBox;
			preload.src = activeURL;
		}

		return false;
	}

	function animateBox() {
		center.className = '';
		fxImage.set(0);
		image.setStyles({backgroundImage: 'url(' + activeURL + ')', display: ''});
		sizer.setStyle('width', preload.width);
		$$(sizer, prevLink, nextLink).setStyle('height', preload.height);

		caption.set('html', images[activeImage][1] || '');
		number.set('html', (((images.length > 1) && options.counterText) || '').replace(/###x###/, activeImage + 1).replace(/###y###/, images.length)); // BEN: Changed marker :-)
		
		/* BEN: Adding shortcuts (presentation mode) */
		if(presentationMode){
			number.setStyle('display','none');
			present.set('html','').setStyle('display','');
			for (i=0; i<images.length; i++) {
				var className = activeImage==i ? 'act' : 'no';
				var shortcut = new Element('a', {'id': 'pmi'+(i+1), 'class': className, 'href': '#', 'events': {click: function(){
					var index = toInt(this.get('id'))-1;
					pause();
					return changeImage(index);
				}}});
				i < 9 ? shortcut.set('text','0'+(i+1)) : shortcut.set('text',i+1);
				shortcut.injectInside(present);
			}
		} else {
			number.setStyle('display','');
			present.setStyle('display','none');	
		}
		/* :NEB */

		if (prevImage >= 0) preloadPrev.src = images[prevImage][0];
		if (nextImage >= 0) preloadNext.src = images[nextImage][0];

		centerWidth = image.offsetWidth;
		centerHeight = image.offsetHeight;
		var top = Math.max(0, middle - (centerHeight / 2)), check = 0, fn;
		if (center.offsetHeight != centerHeight) {
			check = fxResize.start({height: centerHeight, top: top});
		}
		if (center.offsetWidth != centerWidth) {
			check = fxResize.start({width: centerWidth, marginLeft: -centerWidth/2});
		}
		fn = function() {
			bottomContainer.setStyles({width: centerWidth, top: top + centerHeight, marginLeft: -centerWidth/2, visibility: 'hidden', display: ''});
			fxImage.start(1);
		};
		if (check) {
			fxResize.chain(fn);
		}
		else {
			fn();
		}
	}

	function animateCaption() {
		if (prevImage >= 0) prevLink.style.display = '';
		if (nextImage >= 0) nextLink.style.display = '';
		fxBottom.set(-bottom.offsetHeight).start(0);
		bottomContainer.style.visibility = '';
		
		/* BEN: Adding slideshow */
		playLink.setStyle('display','none');	
		pauseLink.setStyle('display','none');
		if(slideshowMode) {
			clearTimeout(slideshowTimer);
			if(slideshowActive){
				pauseLink.setStyle('display','');
				if(activeImage != (images.length - 1)){
					slideshowTimer = setTimeout(next,options.slideshowInterval);
				} else {
					if(options.slideshowAutoclose){
						slideshowTimer = setTimeout(close,options.slideshowInterval);
					} else if (options.loop){
						slideshowTimer = setTimeout(changeImage,options.slideshowInterval,0);
					} else {
						pause();
					}
				}
			} else {
				playLink.setStyle('display','');	
			}
		}
		// Updating saveLink with actual href
		options.allowSave ? saveLink.set('href',images[activeImage][0]).setStyle('display','') : saveLink.setStyle('display','none');
		/* :NEB */
		
	}
	
	/* BEN */
	function togglePlayPause() {
		if(slideshowActive) {
			pause();
		} else {
			play();
		}
		return false;
	}
	
	function play() {
		slideshowActive = true;
		if(activeImage != (images.length - 1)){
			next();
		} else {
			if(options.slideshowAutoclose && !options.loop){
				slideshowTimer = setTimeout(close,0);
			} else if (options.loop){
				changeImage(0);
			} else {
				//pause();
			}
		}
		return false;
	}
	
	function pause() {
		slideshowActive = false;
		clearTimeout(slideshowTimer);
		playLink.setStyle('display','');	
		pauseLink.setStyle('display','none');	
		return false;
	}
	/* :NEB */	

	function stop() {
		preload.onload = $empty;
		preload.src = preloadPrev.src = preloadNext.src = activeURL;
		fxResize.cancel();
		fxImage.cancel();
		fxBottom.cancel();
		$$(prevLink, nextLink, image, bottomContainer).setStyle('display', 'none');
	}

	function close() {
		if (activeImage >= 0) {
			/* BEN: */
			pause();
			/* :NEB */
			stop();
			activeImage = prevImage = nextImage = -1;
			center.style.display = 'none';
			fxOverlay.cancel().chain(setup).start(0);
		}
		return false;
	}


	/*
		API
	*/

	Element.implement({
		slimbox: function(_options, linkMapper) {
			// The processing of a single element is similar to the processing of a collection with a single element
			$$(this).slimbox(_options, linkMapper);

			return this;
		}
	});

	Elements.implement({
		/*
			options:	Optional options object, see Slimbox.open()
			linkMapper:	Optional function taking a link DOM element and an index as arguments and returning an array containing 2 elements:
					the image URL and the image caption (may contain HTML)
			linksFilter:	Optional function taking a link DOM element and an index as arguments and returning true if the element is part of
					the image collection that will be shown on click, false if not. 'this' refers to the element that was clicked.
					This function must always return true when the DOM element argument is 'this'.
		*/
		slimbox: function(_options, linkMapper, linksFilter) {
			linkMapper = linkMapper || function(el) {
				
				/* BEN: */
				el.rel.match(/present.+/) ? presentationMode = true : presentationMode = false;
				el.rel.match(/slideshow.+/) ? slideshowMode = true : slideshowMode = false;
				/* :NEB */
				
				return [el.href, el.title];
			};

			linksFilter = linksFilter || function() {
				return true;
			};

			var links = this;

			links.removeEvents('click').addEvent('click', function() {
				// Build the list of images that will be displayed
				var filteredLinks = links.filter(linksFilter, this);
				return Slimbox.open(filteredLinks.map(linkMapper), filteredLinks.indexOf(this), _options);
			});

			return links;
		}
	});

	return {
		open: function(_images, startImage, _options) {
			options = $extend({
				loop: false,							// Allows to navigate between first and last images
				overlayOpacity: 0.8,					// 1 is opaque, 0 is completely transparent (change the color in the CSS file)
				overlayFadeDuration: 400,				// Duration of the overlay fade-in and fade-out animations (in milliseconds)
				resizeDuration: 400,					// Duration of each of the box resize animations (in milliseconds)
				resizeTransition: false,				// false uses the mootools default transition
				initialWidth: 250,						// Initial width of the box (in pixels)
				initialHeight: 250,						// Initial height of the box (in pixels)
				imageFadeDuration: 400,					// Duration of the image fade-in animation (in milliseconds)
				captionAnimationDuration: 400,			// Duration of the caption animation (in milliseconds)
				counterText: 'Image ###x### of ###y###',// Translate or change as you wish, or set it to false to disable counter text for image groups  // BEN: Changed marker :-)
				closeKeys: [27, 88, 67],				// Array of keycodes to close Slimbox, default: Esc (27), 'x' (88), 'c' (67)
				previousKeys: [37, 80],					// Array of keycodes to navigate to the previous image, default: Left arrow (37), 'p' (80)
				nextKeys: [39, 78],						// Array of keycodes to navigate to the next image, default: Right arrow (39), 'n' (78)
				slideshowKeys: [83],					// BEN: Adding keycode to toggle slideshow on/off (s)
				allowSave:false,						// BEN: Add url to original image?
				slideshowAutoplay: false, 				// BEN:	Is a slideshow active from the start?
				slideshowInterval: 3000, 				// BEN:	Time in milliseconds before the images change during a slideshow
				slideshowAutoclose: true 				// BEN:	Should the lightbox be closed when the slideshow reaches the last image?
			}, _options || {});

			// Setup effects
			fxOverlay = new Fx.Tween(overlay, {property: 'opacity', duration: options.overlayFadeDuration});
			fxResize = new Fx.Morph(center, $extend({duration: options.resizeDuration, link: 'chain'}, options.resizeTransition ? {transition: options.resizeTransition} : {}));
			fxImage = new Fx.Tween(image, {property: 'opacity', duration: options.imageFadeDuration, onComplete: animateCaption});
			fxBottom = new Fx.Tween(bottom, {property: 'margin-top', duration: options.captionAnimationDuration});

			// The function is called for a single image, with URL and Title as first two arguments
			if (typeof _images == 'string') {
				_images = [[_images, startImage]];
				startImage = 0;
			}

			middle = win.getScrollTop() + (win.getHeight() / 2);
			centerWidth = options.initialWidth;
			centerHeight = options.initialHeight;
			center.setStyles({top: Math.max(0, middle - (centerHeight / 2)), width: centerWidth, height: centerHeight, marginLeft: -centerWidth/2, display: ''});
			compatibleOverlay = ie6 || (overlay.currentStyle && (overlay.currentStyle.position != 'fixed'));
			if (compatibleOverlay) overlay.style.position = 'absolute';
			fxOverlay.set(0).start(options.overlayOpacity);
			position();
			setup(1);

			images = _images;
			options.loop = options.loop && (images.length > 1);
			
			/* BEN: */
			slideshowActive = options.slideshowAutoplay && slideshowMode;
			//alert (slideshowActive);
			/* :NEB */
			
			return changeImage(startImage);
		}
	};

})();

/* BEN: Adding an object to make the options easier to handle via TS */
SlimboxOptions = Object.extend({							   
}, window.SlimboxOptions || {});
/* :NEB */
Slimbox.scanPage = function() {
	$$('a').filter(function(el) {
		return el.rel && el.rel.test(/^lightbox/i);
	}).slimbox(SlimboxOptions, null, function(el) {
		return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
	});
};
if (!/android|iphone|ipod|series60|symbian|windows ce|blackberry/i.test(navigator.userAgent)) {
	window.addEvent('domready', Slimbox.scanPage);
}
