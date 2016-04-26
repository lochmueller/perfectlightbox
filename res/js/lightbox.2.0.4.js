// -----------------------------------------------------------------------------------
//
//	Lightbox v2.04
//	by Lokesh Dhakar - http://www.lokeshdhakar.com
//	Last Modification: 2/9/08
//
//	For more information, visit:
//	http://lokeshdhakar.com/projects/lightbox2/
//
//	Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
//  	- Free for use in both personal and commercial projects
//		- Attribution requires leaving author name, author link, and the license info intact.
//	
//  Thanks: Scott Upton(uptonic.com), Peter-Paul Koch(quirksmode.com), and Thomas Fuchs(mir.aculo.us) for ideas, libs, and snippets.
//  		Artemy Tregubenko (arty.name) for cleanup and help in updating to latest ver of proto-aculous.
//
// -----------------------------------------------------------------------------------

LightboxOptions = Object.extend({
    //fileLoadingImage:        'images/loading.gif',    // BEN: This is obsolete
    //fileBottomNavCloseImage: 'images/closelabel.gif', // BEN: This is obsolete
    overlayOpacity: 0.8,   								// Controls transparency of shadow overlay
    animate: true,         								// Toggles resizing animations
    resizeSpeed: 400,        							// Controls the speed of the image resizing animations (1=slowest and 10=fastest)
    borderSize: 10,         							// If you adjust the padding in the CSS, you will need to update this variable
	loop:false,											// BEN: Ported from slimbox
	allowSave:false,									// BEN: Add url to original image?
	slideshowAutoplay: false, 							// BEN:	Is a slideshow active from the start?
	slideshowInterval: 3000, 							// BEN:	Time in milliseconds before the images change during a slideshow
	slideshowAutoclose: true, 							// BEN:	Should the lightbox be closed when the slideshow reaches the last image?
	labelImage: "Image",
	labelOf: "of"
}, window.LightboxOptions || {});



var Lightbox = Class.create();
Lightbox.prototype = {
    imageArray: [],
    activeImage: undefined,
	
    // initialize()
    // Constructor runs on completion of the DOM loading. Calls updateImageList and then
    // the function inserts html at the bottom of the page which is used to display the shadow 
    // overlay and the image container.
    //
    initialize: function() {  
		/* BEN */
		var presentationMode, slideshowMode, slideshowActive, slideshowTimer, prevImage, nextImage;
		/* :NEB */
	
        this.updateImageList();
        this.keyboardAction = this.keyboardAction.bindAsEventListener(this);
		
		/* BEN */
		if(LightboxOptions.animate){
			this.overlayDuration = LightboxOptions.resizeSpeed/1000;
			this.resizeDuration = LightboxOptions.resizeSpeed/1000;
		} else { 
			this.overlayDuration = 0;
			this.resizeDuration = 0;
		}

        //if (LightboxOptions.resizeSpeed > 10) LightboxOptions.resizeSpeed = 10;
        //if (LightboxOptions.resizeSpeed < 1)  LightboxOptions.resizeSpeed = 1;

	    //this.resizeDuration = LightboxOptions.animate ? ((11 - LightboxOptions.resizeSpeed) * 0.15) : 0;
	    //this.overlayDuration = LightboxOptions.animate ? 0.2 : 0;  // shadow fade in/out duration
		/* :NEB */

        // When Lightbox starts it will resize itself from 250 by 250 to the current image dimension.
        // If animations are turned off, it will be hidden as to prevent a flicker of a
        // white 250 by 250 box.
        var size = (LightboxOptions.animate ? 250 : 1) + 'px';

        var objBody = $$('body')[0];

		objBody.appendChild(Builder.node('div',{id:'overlay'}));
	
        objBody.appendChild(Builder.node('div',{id:'lbLightbox'}, [
            Builder.node('div',{id:'lbOuterImageContainer'}, 
                Builder.node('div',{id:'lbImageContainer'}, [
                    Builder.node('img',{id:'lbLightboxImage'}), 
                    Builder.node('div',{id:'lbHoverNav'}, [
                        Builder.node('a',{id:'prevLink', href: '#' }),
                        Builder.node('a',{id:'nextLink', href: '#' })
                    ]),
                    Builder.node('div',{id:'lbLoading'}, 
                        Builder.node('a',{id:'loadingLink', href: '#' } 
                            // BEN: Builder.node('img', {src: LightboxOptions.fileLoadingImage})
                        )
                    )
                ])
            ),
            Builder.node('div', {id:'lbImageDataContainer'},
                Builder.node('div',{id:'lbImageData'}, [
                    Builder.node('div',{id:'lbImageDetails'}, [
                        Builder.node('span',{id:'lbCaption'}),
                        Builder.node('span',{id:'lbNumberDisplay'}),
						// BEN:
						Builder.node('span',{id:'lbPresent'})
						// :NEB
                    ]),
                    Builder.node('div',{id:'lbBottomNav'}, [
						Builder.node('a',{id:'closeLink', href: '#' }
                            // BEN: Builder.node('img', { src: LightboxOptions.fileBottomNavCloseImage })
                        ),
						// BEN:
						Builder.node('a',{id:'playLink', href: '#' }),	
						Builder.node('a',{id:'pauseLink', href: '#' }),
						Builder.node('a',{id:'saveLink', href: '#', target: '_blank' })
						// :NEB
                    ])
                ])
            )
        ]));


		$('overlay').hide().observe('click', (function() { this.end(); }).bind(this));
		$('lbLightbox').hide().observe('click', (function(event) { if (event.element().id == 'lbLightbox') this.end(); }).bind(this));
		$('lbOuterImageContainer').setStyle({ width: size, height: size });
		$('prevLink').observe('click', (function(event) { event.stop(); this.previous(); }).bindAsEventListener(this)); //BEN: Changed associated function
		$('nextLink').observe('click', (function(event) { event.stop(); this.next(); }).bindAsEventListener(this)); //BEN: Changed associated function
		$('loadingLink').observe('click', (function(event) { event.stop(); this.end(); }).bind(this));
		/* BEN: */
		$('playLink').observe('click', (function(event) { event.stop(); this.play(); }).bindAsEventListener(this));
		$('pauseLink').observe('click', (function(event) { event.stop(); this.pause(); }).bindAsEventListener(this));
		/* :NEB */
		$('closeLink').observe('click', (function(event) { event.stop(); this.end(); }).bind(this));

        var th = this;
        (function(){
			// BEN: Updated for new id-names and elements
            var ids = 
                'overlay lbLightbox lbOuterImageContainer lbImageContainer lbLightboxImage lbHoverNav prevLink nextLink lbLoading loadingLink ' + 
                'lbImageDataContainer lbImageData lbImageDetails lbCaption lbNumberDisplay lbPresent lbBottomNav playLink pauseLink saveLink closeLink';   
            $w(ids).each(function(id){ th[id] = $(id); });
        }).defer();
    },

    //
    // updateImageList()
    // Loops through anchor tags looking for 'lightbox' references and applies onclick
    // events to appropriate links. You can rerun after dynamically adding images w/ajax.
    //
    updateImageList: function() {   
        this.updateImageList = Prototype.emptyFunction;

        document.observe('click', (function(event){
            var target = event.findElement('a[rel^=lightbox]') || event.findElement('area[rel^=lightbox]');
            if (target) {
				/* BEN: */
				target.rel.match(/present.+/) ? this.presentationMode = true : this.presentationMode = false;
				target.rel.match(/slideshow.+/) ? this.slideshowMode = true : this.slideshowMode = false;
				this.slideshowActive = LightboxOptions.slideshowAutoplay && this.slideshowMode;
				/* :NEB */ 
                event.stop();
                this.start(target);
            }
        }).bind(this));
    },
    
    //
    //  start()
    //  Display overlay and lightbox. If image is part of a set, add siblings to imageArray.
    //
    start: function(imageLink) {    

        $$('select', 'object', 'embed').each(function(node){ node.style.visibility = 'hidden' });

        // stretch overlay to fill page and fade in
        var arrayPageSize = this.getPageSize();
        $('overlay').setStyle({ width: arrayPageSize[0] + 'px', height: arrayPageSize[1] + 'px' });

        new Effect.Appear(this.overlay, { duration: this.overlayDuration, from: 0.0, to: LightboxOptions.overlayOpacity });

        this.imageArray = [];
        var imageNum = 0;       

        if ((imageLink.rel == 'lightbox')){
            // if image is NOT part of a set, add single image to imageArray
            this.imageArray.push([imageLink.href, imageLink.title]);         
        } else {
            // if image is part of a set..
            this.imageArray = $$(imageLink.tagName + '[href][rel="' + imageLink.rel + '"]').collect(function(anchor){ return [anchor.href, anchor.title]; }).uniq();          
            while (this.imageArray[imageNum][0] != imageLink.href) { imageNum++; }
        }

        // calculate top and left offset for the lightbox 
        var arrayPageScroll = document.viewport.getScrollOffsets();
        var lightboxTop = arrayPageScroll[1] + (document.viewport.getHeight() / 10);
        var lightboxLeft = arrayPageScroll[0];
        this.lbLightbox.setStyle({ top: lightboxTop + 'px', left: lightboxLeft + 'px' }).show();
        
        this.changeImage(imageNum);
    },
	
	/* BEN: */
	previous: function() {
		this.changeImage(this.prevImage);
	},

	next: function() {
		this.changeImage(this.nextImage);
	},
	/* :NEB */

    //
    //  changeImage()
    //  Hide most elements and preload image in preparation for resizing image container.
    //
    changeImage: function(imageNum) {   
        
        this.activeImage = imageNum; // update global var
		
		/* BEN: */
		LightboxOptions.loop = LightboxOptions.loop && (this.imageArray.length > 1);
		this.prevImage = (this.activeImage || (LightboxOptions.loop ? this.imageArray.length : 0)) - 1;
		this.nextImage = ((this.activeImage + 1) % this.imageArray.length) || (LightboxOptions.loop ? 0 : -1);
		/* :NEB */

        // hide elements during transition
        if (LightboxOptions.animate) this.lbLoading.show();
        this.lbLightboxImage.hide();
        this.lbHoverNav.hide();
        this.prevLink.hide();
        this.nextLink.hide();
		// HACK: Opera9 does not currently support scriptaculous opacity and appear fx
        this.lbImageDataContainer.setStyle({opacity: .0001});
        this.lbNumberDisplay.hide();      
        
        var imgPreloader = new Image();
        
        // once image is preloaded, resize image container


        imgPreloader.onload = (function(){
            this.lbLightboxImage.src = this.imageArray[this.activeImage][0];
            this.resizeImageContainer(imgPreloader.width, imgPreloader.height);
        }).bind(this);
        imgPreloader.src = this.imageArray[this.activeImage][0];
		
		/* BEN: */
		if (LightboxOptions.allowSave) {
			this.saveLink.setAttribute('href',this.imageArray[this.activeImage][0]);
			this.saveLink.setStyle({'display':''});
		} else {
			this.saveLink.setStyle({'display':'none'});
		}
		/* :NEB */
		
    },

    //
    //  resizeImageContainer()
    //
    resizeImageContainer: function(imgWidth, imgHeight) {

        // get current width and height
        var widthCurrent  = this.lbOuterImageContainer.getWidth();
        var heightCurrent = this.lbOuterImageContainer.getHeight();

        // get new width and height
        var widthNew  = (imgWidth  + LightboxOptions.borderSize * 2);
        var heightNew = (imgHeight + LightboxOptions.borderSize * 2);

        // scalars based on change from old to new
        var xScale = (widthNew  / widthCurrent)  * 100;
        var yScale = (heightNew / heightCurrent) * 100;

        // calculate size difference between new and old image, and resize if necessary
        var wDiff = widthCurrent - widthNew;
        var hDiff = heightCurrent - heightNew;

        if (hDiff != 0) new Effect.Scale(this.lbOuterImageContainer, yScale, {scaleX: false, duration: this.resizeDuration, queue: 'front'}); 
        if (wDiff != 0) new Effect.Scale(this.lbOuterImageContainer, xScale, {scaleY: false, duration: this.resizeDuration, delay: this.resizeDuration}); 

        // if new and old image are same size and no scaling transition is necessary, 
        // do a quick pause to prevent image flicker.
        var timeout = 0;
        if ((hDiff == 0) && (wDiff == 0)){
            timeout = 100;
            if (Prototype.Browser.IE) timeout = 250;   
        }

        (function(){
            this.prevLink.setStyle({ height: imgHeight + 'px' });
            this.nextLink.setStyle({ height: imgHeight + 'px' });
            this.lbImageDataContainer.setStyle({ width: widthNew + 'px' });

            this.showImage();
        }).bind(this).delay(timeout / 1000);
    },
    
    //
    //  showImage()
    //  Display image and begin preloading neighbors.
    //
    showImage: function(){
        this.lbLoading.hide();
        new Effect.Appear(this.lbLightboxImage, { 
            duration: this.resizeDuration, 
            queue: 'end', 
            afterFinish: (function(){ this.updateDetails(); }).bind(this) 
        });
        this.preloadNeighborImages();
    },
	
    //
    // toInt(s)	
	// Failsafe version of parseInt()
    //
	toInt: function(s) {
		return parseInt(s.replace(/\D/g,''));
	},

    //
    //  updateDetails()
    //  Display caption, image number, and bottom nav.
    //
    updateDetails: function() {
		
		/* BEN: At first reset numberDisplay and caption */
		this.lbNumberDisplay.update('');
		this.lbCaption.update('');
		/* :NEB */	

    
        // if caption is not null
        if (this.imageArray[this.activeImage][1] != ""){
            this.lbCaption.update(this.imageArray[this.activeImage][1]).show();
        }
        
        // if image is part of set display 'Image x of x' 
        if (this.imageArray.length > 1){
            this.lbNumberDisplay.update( LightboxOptions.labelImage + ' ' + (this.activeImage + 1) + ' ' + LightboxOptions.labelOf + '  ' + this.imageArray.length).show();
        }
		
		/* BEN: Adding shortcuts (presentation mode) */
		if(this.presentationMode){
			this.lbNumberDisplay.setStyle({'display':'none'});
			this.lbPresent.update('').setStyle({'display':''});
			for (i=0; i<this.imageArray.length; i++) {
				var className = this.activeImage==i ? 'act' : 'no';
				var shortcut = new Element('a', {id: 'pmi'+(i+1), 'class': className, href: '#'})
				i < 9 ? shortcut.update('0'+(i+1)) : shortcut.update(i+1);
				shortcut.observe('click', (function(event) {
					event.stop();
					var el = Event.findElement(event,'a');
					var index = this.toInt(el.id)-1;
					this.pause();
					this.changeImage(index);
				}).bindAsEventListener(this));
				this.lbPresent.insert({bottom:shortcut});
			}
		} else {
			this.lbNumberDisplay.setStyle({'display':''});
			this.lbPresent.setStyle({'display':'none'});	
		}
		/* :NEB */
		
		/* BEN: Adding slideshow */
		this.playLink.setStyle({'display':'none'});
		this.pauseLink.setStyle({'display':'none'});
		if(this.slideshowMode) {
			clearTimeout(this.slideshowTimer);
			if(this.slideshowActive){
				this.pauseLink.setStyle({'display':''});
				if(this.activeImage != (this.imageArray.length - 1)){
					this.slideshowTimer = setTimeout(this.next.bind(this),LightboxOptions.slideshowInterval);
				} else {
					if(LightboxOptions.slideshowAutoclose){
						this.slideshowTimer = setTimeout(this.end.bind(this),LightboxOptions.slideshowInterval);
					} else if (LightboxOptions.loop){
						this.slideshowTimer = setTimeout(this.changeImage.bind(this,0),LightboxOptions.slideshowInterval);
					} else {
						this.pause();
					}
				}
			} else {
				this.playLink.setStyle({'display':''});
			}
		}
		/* :NEB */

        new Effect.Parallel(
            [ 
                new Effect.SlideDown(this.lbImageDataContainer, { sync: true, duration: this.resizeDuration, from: 0.0, to: 1.0 }), 
                new Effect.Appear(this.lbImageDataContainer, { sync: true, duration: this.resizeDuration }) 
            ], 
            { 
                duration: this.resizeDuration, 
                afterFinish: (function() {
	                // update overlay size and update nav
	                var arrayPageSize = this.getPageSize();
	                this.overlay.setStyle({ height: arrayPageSize[1] + 'px' });
	                this.updateNav();
                }).bind(this)
            } 
        );
    },

    //
    //  updateNav()
    //  Display appropriate previous and next hover navigation.
    //
    updateNav: function() {

        this.lbHoverNav.show();               

		/* BEN: */
		if (this.prevImage >= 0) this.prevLink.show();
		if (this.nextImage >= 0) this.nextLink.show();
		
        // if not first image in set, display prev image button
        //if (this.activeImage > 0) this.prevLink.show();

        // if not last image in set, display next image button
        //if (this.activeImage < (this.imageArray.length - 1)) this.nextLink.show();
		/* :NEB */
		
        this.enableKeyboardNav();
    },

    //
    //  enableKeyboardNav()
    //
    enableKeyboardNav: function() {
        document.observe('keydown', this.keyboardAction); 
    },

    //
    //  disableKeyboardNav()
    //
    disableKeyboardNav: function() {
        document.stopObserving('keydown', this.keyboardAction); 
    },

    //
    //  keyboardAction()
    //
    keyboardAction: function(event) {
        var keycode = event.keyCode;

        var escapeKey;
        if (event.DOM_VK_ESCAPE) {  // mozilla
            escapeKey = event.DOM_VK_ESCAPE;
        } else { // ie
            escapeKey = 27;
        }

        var key = String.fromCharCode(keycode).toLowerCase();
        
        if (key.match(/x|o|c/) || (keycode == escapeKey)){ // close lightbox
            this.end();
		/* BEN: Add key to toggle slideshow on/off (s) */
		} else if ((key == 's') || (keycode == 83)) {
			this.togglePlayPause();
		/* :NEB */
        } else if ((key == 'p') || (keycode == 37)){ // display previous image
            if (this.activeImage != 0){
                this.disableKeyboardNav();
                this.changeImage(this.activeImage - 1);
            }
        } else if ((key == 'n') || (keycode == 39)){ // display next image
            if (this.activeImage != (this.imageArray.length - 1)){
                this.disableKeyboardNav();
                this.changeImage(this.activeImage + 1);
            }
        }
    },

    //
    //  preloadNeighborImages()
    //  Preload previous and next images.
    //
    preloadNeighborImages: function(){
        var preloadNextImage, preloadPrevImage;
        if (this.imageArray.length > this.activeImage + 1){
            preloadNextImage = new Image();
            preloadNextImage.src = this.imageArray[this.activeImage + 1][0];
        }
        if (this.activeImage > 0){
            preloadPrevImage = new Image();
            preloadPrevImage.src = this.imageArray[this.activeImage - 1][0];
        }
    
    },
	
	/* BEN */
	togglePlayPause: function() {
		if(this.slideshowActive) {
			this.pause();
		} else {
			this.play();
		}	
	},
	
	play: function() {
		this.slideshowActive = true;
		if(this.activeImage != (this.imageArray.length - 1)){
			this.changeImage(this.activeImage + 1);
		} else {
			if(LightboxOptions.slideshowAutoclose && !LightboxOptions.loop){
				this.slideshowTimer = setTimeout(this.end.bind(this),0);
			} else if (LightboxOptions.loop){
				this.changeImage(0);
			} else {
				//this.pause();
			}
		}
	},
	
	pause: function() {
		this.slideshowActive = false;
		clearTimeout(this.slideshowTimer);
		this.playLink.setStyle({'display':''});
		this.pauseLink.setStyle({'display':'none'});
	},
	/* :NEB */

    //
    //  end()
    //
    end: function() {
		/* BEN: */
		this.pause();
		/* :NEB */
        this.disableKeyboardNav();
        this.lbLightbox.hide();
        new Effect.Fade(this.overlay, { duration: this.overlayDuration });
        $$('select', 'object', 'embed').each(function(node){ node.style.visibility = 'visible'; });
    },

    //
    //  getPageSize()
    //
    getPageSize: function() {
	        
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
	
		// for small pages with total width less then width of the viewport
		if(xScroll < windowWidth){	
			pageWidth = xScroll;		
		} else {
			pageWidth = windowWidth;
		}

		return [pageWidth,pageHeight];
	}
};

document.observe('dom:loaded', function () { new Lightbox(); });