/*
	Slimbox v1.41 - The ultimate lightweight Lightbox clone
	by Christophe Beyls (http://www.digitalia.be) - MIT-style license.
	Inspired by the original Lightbox v2 by Lokesh Dhakar.
	// #######################################################################
	Modified by Ben. Added save-button, presentation mode and a slideshow.
	Added vars for localization and various little changes.
	THANKS Christophe for sharing!
	// #######################################################################
*/

var Lightbox = {

	init: function(options){
		this.options = $extend({
			resizeSpeed: 400,
			resizeTransition: false,	// default transition
			initialWidth: 250,
			initialHeight: 250,
			animate: true,
			showCounter: true,
			// #######################################################################
			overlayOpacity: 0.8,
			allowSave: true,
			slideshowAutoplay: true, // Is a slideshow active from the start?
			slideshowInterval: 5000, // Time in milliseconds before the images change during a slideshow
			slideshowAutoclose: false, // Should the lightbox be closed when the slideshow reaches the last image?
			lllImage: 'Image',
			lllOf: 'of'
			// #######################################################################
		}, options || {});
		
		// #######################################################################
		this.resizeDuration = this.options.animate ? this.options.resizeSpeed : 0;
		// #######################################################################
		
		this.anchors = [];
		$each(document.links, function(el){
			if (el.rel && el.rel.test(/^lightbox/i)){
				el.onclick = this.click.pass(el, this);
				this.anchors.push(el);
			}
		}, this);
		this.eventKeyDown = this.keyboardListener.bindAsEventListener(this);
		this.eventPosition = this.position.bind(this);

		this.overlay = new Element('div', {'id': 'overlay'}).injectInside(document.body);

		this.center = new Element('div', {'id': 'sbCenter', 'styles': {'width': this.options.initialWidth, 'height': this.options.initialHeight, 'marginLeft': -(this.options.initialWidth/2), 'display': 'none'}}).injectInside(document.body);
		this.image = new Element('div', {'id': 'sbImage'}).injectInside(this.center);
		this.prevLink = new Element('a', {'id': 'prevLink', 'href': '#', 'styles': {'display': 'none'}}).injectInside(this.image);
		this.nextLink = this.prevLink.clone().setProperty('id', 'nextLink').injectInside(this.image);
		this.prevLink.onclick = this.previous.bind(this);
		this.nextLink.onclick = this.next.bind(this);

		this.bottomContainer = new Element('div', {'id': 'sbBottomContainer', 'styles': {'display': 'none'}}).injectInside(document.body);
		this.bottom = new Element('div', {'id': 'sbBottom'}).injectInside(this.bottomContainer);
		// #######################################################################
		this.playLink = new Element('a', {'id': 'playLink', 'href': '#', 'styles': {'display': 'none'}}).injectInside(this.bottom);
		this.pauseLink = this.playLink.clone().setProperty('id', 'pauseLink').injectInside(this.bottom);
		this.playLink.onclick = this.play.bind(this);
		this.pauseLink.onclick = this.pause.bind(this);
		if(this.options.allowSave){this.saveLink = new Element('a', {'id': 'saveLink', 'href': '#'}).injectInside(this.bottom);}	
		// #######################################################################
		new Element('a', {'id': 'closeLink', 'href': '#'}).injectInside(this.bottom).onclick = this.overlay.onclick = this.close.bind(this);
		this.caption = new Element('div', {'id': 'sbCaption'}).injectInside(this.bottom);
		this.number = new Element('div', {'id': 'sbNumber'}).injectInside(this.bottom);
		// #######################################################################
		this.present = new Element('div', {'id': 'sbPresent'}).injectInside(this.bottom);		
		// #######################################################################
		new Element('div', {'styles': {'clear': 'both'}}).injectInside(this.bottom);

		var nextEffect = this.nextEffect.bind(this);
		this.fx = {
			overlay: this.overlay.effect('opacity', {duration: this.resizeDuration}).hide(),
			resize: this.center.effects($extend({duration: this.resizeDuration, onComplete: nextEffect}, this.options.resizeTransition ? {transition: this.options.resizeTransition} : {})),
			image: this.image.effect('opacity', {duration: this.resizeDuration, onComplete: nextEffect}),
			bottom: this.bottom.effect('margin-top', {duration: this.resizeDuration, onComplete: nextEffect})
		};

		this.preloadPrev = new Image();
		this.preloadNext = new Image();
	},

	click: function(link){
		if (link.rel.length == 8) return this.show(link.href, link.title);

		var j, imageNum, images = [];
		this.anchors.each(function(el){
			// alert('click()');
			if (el.rel == link.rel){
				// #######################################################################
				// These checks are done for each el.rel! Could be optimized to do it only once as we already know the rels are all the same (see line above)
				this.presentationMode = el.rel.test('present');
				// alert(this.presentationMode);
				this.slideshow = el.rel.test('slideshow');
				// alert(this.slideshow);
				// #######################################################################
				for (j = 0; j < images.length; j++) if(images[j][0] == el.href) break;
				if (j == images.length){
					images.push([el.href, el.title]);
					if (el.href == link.href) imageNum = j;
				}
			}
		}, this);
		// #######################################################################
		// Add vars need for the timeouts of the slideshow
		if(this.slideshow){
			//this.slideshowIDArray = new Array();
			//this.slideshowIDCount = 0;
			//alert(this.slideshowIDCount);
			this.playLink.style.display = '';
			this.pauseLink.style.display = '';
			this.slideshowActive = this.options.slideshowAutoplay;
			//alert(this.slideshowActive);
		} else {
			this.playLink.style.display = 'none';
			this.pauseLink.style.display = 'none';
		}
		// #######################################################################
		return this.open(images, imageNum);
	},

	show: function(url, title){
		return this.open([[url, title]], 0);
	},

	open: function(images, imageNum){
		this.images = images;
		this.position();
		this.setup(true);
		this.top = window.getScrollTop() + (window.getHeight() / 15);
		this.center.setStyles({top: this.top, display: ''});
		// Added var "overlayOpacity" to be used here
		this.fx.overlay.start(this.options.overlayOpacity);
		return this.changeImage(imageNum);
	},

	position: function(){
		this.overlay.setStyles({'top': window.getScrollTop(), 'height': window.getHeight()});
	},

	setup: function(open){
		var elements = $A(document.getElementsByTagName('object'));
		elements.extend(document.getElementsByTagName(window.ie ? 'select' : 'embed'));
		elements.each(function(el){
			if (open) el.lbBackupStyle = el.style.visibility;
			el.style.visibility = open ? 'hidden' : el.lbBackupStyle;
		});
		var fn = open ? 'addEvent' : 'removeEvent';
		window[fn]('scroll', this.eventPosition)[fn]('resize', this.eventPosition);
		document[fn]('keydown', this.eventKeyDown);
		this.step = 0;
	},

	keyboardListener: function(event){
		switch (event.keyCode){
			case 27: case 88: case 67: this.close(); break;
			case 37: case 80: this.previous(); break;	
			case 39: case 78: this.next(); break;
			// #######################################################################	
			case 83: if(this.slideshowActive){this.pause();}else{this.play();}
			// #######################################################################	
		}
	},

	previous: function(){
		this.pause();
		return this.changeImage(this.activeImage-1);
	},

	next: function(){
		this.pause();
		return this.changeImage(this.activeImage+1);
	},
	
	// #######################################################################	
	play: function(){
		this.slideshowActive = true;
		if(this.activeImage != (this.images.length - 1)){
			//alert('play: '+this.slideshowActive);
			return this.changeImage(this.activeImage+1);
		} else {
			if(this.options.slideshowAutoclose){
				this.close();
			} else {
				return this.changeImage(0);	
			}
		}	
	},

	pause: function(){
		// If no slideshow is active at the moment immediatly return -> better performance
		// That's because this function sometimes is called even if the slideshow is aleady inactive!
		if(!this.slideshowActive){return false;}
		this.slideshowTimer = $clear(this.slideshowTimer);
		this.slideshowActive = false;
		//alert('Pausing');
		this.playLink.style.display = '';
		this.pauseLink.style.display = 'none';
		return false;
	},
	// #######################################################################

	changeImage: function(imageNum){
		if (this.step || (imageNum < 0) || (imageNum >= this.images.length)) return false;
		this.step = 1;
		this.activeImage = imageNum;

		this.bottomContainer.style.display = this.prevLink.style.display = this.nextLink.style.display = 'none';
		this.fx.image.hide();
		this.center.className = 'sbLoading';

		this.preload = new Image();
		this.preload.onload = this.nextEffect.bind(this);
		this.preload.src = this.images[imageNum][0];
		return false;
	},

	nextEffect: function(){
		switch (this.step++){
		case 1:
			this.center.className = '';
			this.image.style.backgroundImage = 'url('+this.images[this.activeImage][0]+')';
			this.image.style.width = this.bottom.style.width = this.preload.width+'px';
			this.image.style.height = this.prevLink.style.height = this.nextLink.style.height = this.preload.height+'px';
			// #######################################################################
			if(this.images[this.activeImage][1]){
				this.caption.style.display = '';
				this.caption.setHTML(this.images[this.activeImage][1]);
			}
			else {
				this.caption.style.display = 'none';
				this.caption.setHTML('');
			}
			if(!this.options.showCounter || (this.images.length == 1) || this.presentationMode){
				this.number.style.display = 'none';
				this.number.setHTML('');	
			} else {
				this.number.style.display = '';
				this.number.setHTML(this.options.lllImage+' '+(this.activeImage+1)+' '+this.options.lllOf+' '+this.images.length);
			}
			// #######################################################################
			
			//this.number.setHTML((!this.options.showCounter || (this.images.length == 1) || this.presentationMode) ? '' : this.options.lllImage+' '+(this.activeImage+1)+' '+this.options.lllOf+' '+this.images.length);
			
			// #######################################################################
			this.present.style.display = 'none';
			this.present.empty();
			if (this.presentationMode){
				this.present.style.display = '';
				for(var i=1;i<=(this.images.length);i++){
					var className = this.activeImage==(i-1) ? 'act' : 'no';
						this.presentLink = new Element('a', {'id': 'pmi'+i+'', 'href': '#', 'class': className}).injectInside(this.present);
						this.presentLink.setHTML(i+' ');
						this.presentLink.onclick = this.changeImage.bind(this,(i-1));
						this.presentLink.addEvent('click',function(){Lightbox.pause()});
				}
			}
			if(this.options.allowSave){this.saveLink.set({'href': this.images[this.activeImage][0],'target': '_blank'});}
			if(this.slideshow){
				if(this.slideshowActive){
					this.playLink.style.display = 'none';
					this.pauseLink.style.display = '';		
				} else {
					this.playLink.style.display = '';
					this.pauseLink.style.display = 'none';				
				}
			}
			// #######################################################################

			if (this.activeImage) this.preloadPrev.src = this.images[this.activeImage-1][0];
			if (this.activeImage != (this.images.length - 1)) this.preloadNext.src = this.images[this.activeImage+1][0];
			if (this.center.clientHeight != this.image.offsetHeight){
				this.fx.resize.start({height: this.image.offsetHeight});
				break;
			}
			this.step++;
		case 2:
			if (this.center.clientWidth != this.image.offsetWidth){
				this.fx.resize.start({width: this.image.offsetWidth, marginLeft: -this.image.offsetWidth/2});
				break;
			}
			this.step++;
		case 3:
			this.bottomContainer.setStyles({top: this.top + this.center.clientHeight, height: 0, marginLeft: this.center.style.marginLeft, display: ''});
			this.fx.image.start(1);
			break;
		case 4:
			if (this.options.animate){
				this.fx.bottom.set(-this.bottom.offsetHeight);
				this.bottomContainer.style.height = '';
				this.fx.bottom.start(0);
				break;
			}
			this.bottomContainer.style.height = '';
		case 5:
			if (this.activeImage) this.prevLink.style.display = '';
			if (this.activeImage != (this.images.length - 1)) this.nextLink.style.display = '';
			// #######################################################################
			if(this.slideshowActive){
				if(this.activeImage != (this.images.length - 1)){
					this.slideshowTimer = this.changeImage.delay(this.options.slideshowInterval,Lightbox,this.activeImage+1);
				} else {
					if(this.options.slideshowAutoclose){
						this.slideshowTimer = this.close.delay(this.options.slideshowInterval,Lightbox);
						//alert('Closing in '+this.options.slideshowInterval+'ms');
					} else {
						this.pause();	
					}
				}
			}
			// #######################################################################
			this.step = 0;
		}
	},

	close: function(){
		// #######################################################################
		this.slideshowTimer = $clear(this.slideshowTimer);
		this.slideshowActive = false;
		//alert('Shutting down');
		// #######################################################################
		if (this.step < 0) return;
		this.step = -1;
		if (this.preload){
			this.preload.onload = Class.empty;
			this.preload = null;
		}
		for (var f in this.fx) this.fx[f].stop();
		this.center.style.display = this.bottomContainer.style.display = 'none';
		this.fx.overlay.chain(this.setup.pass(false, this)).start(0);
		return false;
	}
};

//window.addEvent('domready', Lightbox.init.bind(Lightbox));
