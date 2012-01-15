/*!
 * jquery slides plugin
 * Copyright 2011, Stefan Benicke (opusonline.at)
 * Dual licensed under the MIT or GPL Version 3 licenses.
 */
(function($) {
	
	var defaults = {
		speed: 350,
		crossfade: false,
		vertical: false,
		start: 1,
		pagination: true,
		createPrevNext: true,
		createPagination: true,
		createPlayPause: true,
		createCaption: true,
		slideClass: 'slide',
		currentClass: 'current',
		captionClass: 'slides_caption',
		containerClass: 'slides_container',
		paginationClass: 'slides_pagination',
		prevClass: 'slides_prev',
		nextClass: 'slides_next',
		prevText: 'prev',
		nextText: 'next',
		slideshow: true,
		autoplay: true,
		timeout: 3000,
		hoverPause: true,
		slideshowClass: 'slides_slideshow',
		slideshowPauseClass: 'pause',
		playText: 'play',
		pauseText: 'pause',
		formatPaginationText: function(number) { return number; },
		animationStart: function() {},
		animationComplete: function() {}
	},
	w = window,
	
	Slides = function(root, options) {
		var self = this,
		$root = $(root),
		$pages = $root.find('.' + options.slideClass),
		number = $pages.size(),
		$first_page = $pages.first(),
		width = $first_page.width(),
		height = $first_page.height(),
		active_id = options.start - 1,
		is_active,
		timer,
		pagination_list,
		$last_pagination,
		$slideshow,
		is_slideshow,
		
		_nextClick = function() {
			var direction = $.data(this, 'dir');
			self.slideshowPause();
			self.next(direction);
		},
		_paginationClick = function() {
			var id = $.data(this, 'id');
			self.slideshowPause();
			self.go(id);
		},
		_slideshowClick = function() {
			if (is_slideshow) self.slideshowPause();
			else self.slideshowStart();
		},
		_construct = function() {
			_initPages();
			if (options.createPrevNext)
				_createPrevNext();
			if (options.pagination) {
				if (options.createPagination) {
					_createPagination();
				}
				_initPagination();
			}
			if (options.slideshow) {
				if (options.createPlayPause) {
					_createPlayPause();
				}
				_initSlideshow();
			}
			return self;
		},
		_initPages = function() {
			$pages.each(function(index) {
				var me = this;
				if (options.createCaption) {
					if (me.title) {
						$(me).append('<div class="' + options.captionClass + '">' + me.title + '</div>');
						me.removeAttribute('title');
					}
				}
				if (index == active_id) {
					me.style.display = 'block';
					return;
				}
				if (options.crossfade) {
					me.style.display = 'none';
				} else {
					me.style.display = 'block';
					_setPosition(me, options.vertical ? height : width);
				}
			});
		},
		_createPrevNext = function() {
			var $prev = $('<span class="' + options.prevClass + '">' + options.prevText + '</span>').data('dir', -1).click(_nextClick),
			$next = $('<span class="' + options.nextClass + '">' + options.nextText + '</span>').data('dir', 1).click(_nextClick);
			$root.append($prev, $next);
		},
		_createPagination = function() {
			var pagination = '<ul class="' + options.paginationClass + '">';
			for (var i = 0; i < number; i++) {
				var page = options.formatPaginationText(i + 1);
				pagination += '<li>' + page + '</li>';
			}
			$root.append(pagination);
		},
		_initPagination = function() {
			pagination_list = [];
			$root.find('ul.' + options.paginationClass).first().on('click', 'li', _paginationClick)
			.find('li').each(function(i) {
				var $li = $(this);
				$li.data('id', i);
				if (i == active_id) {
					$last_pagination = $li.addClass(options.currentClass);
				}
				pagination_list.push($li);
			});
		},
		_createPlayPause = function() {
			$slideshow = $('<span class="' + options.slideshowClass + '">' + options.playText + '</span>').click(_slideshowClick);
			$root.append($slideshow);
		},
		_initSlideshow = function() {
			if (options.hoverPause) {
				$root.on('mouseenter', '.' + options.slideClass, function() {
					self.slideshowPause();
				}).on('mouseleave', '.' + options.slideClass, function() {
					self.slideshowStart();
				});
			}
			if (options.autoplay) self.slideshowStart();
		},
		_calcPosition = function(next_id, direction) {
			if (is_active) return;
			if (next_id < 0) next_id = 0;
			if (next_id > number - 1) next_id = number - 1;
			if (active_id == next_id) return;
			var active = $pages.eq(active_id),
			next = $pages.eq(next_id);
			is_active = 1;
			options.animationStart.call(next, next_id + 1);
			if (options.crossfade) {
				active[0].style.zIndex = 1;
				next[0].style.display = 'block';
				active.fadeOut(options.speed, function() {
					this.style.zIndex = 0;
					is_active = 0;
					options.animationComplete.call(next, next_id + 1);
				});
			} else {
				var hide_position = options.vertical ? direction * height : direction * width;
				_setPosition(next, hide_position);
				_animate(active, -hide_position);
				_animate(next, 0, options.animationComplete, next_id + 1);
			}
			active_id = next_id;
			_highlightPagination();
		},
		_highlightPagination = function() {
			var $next_pagination = pagination_list[active_id];
			if ( ! $next_pagination) return;
			if ($last_pagination) $last_pagination.removeClass(options.currentClass);
			$last_pagination = $next_pagination.addClass(options.currentClass);
		},
		_animate = function(element, position, callback, next_id) {
			var animate = options.vertical ? {top: position} : {left: position};
			element.animate(animate, options.speed, function() {
				is_active = 0;
				if (callback) callback.call(element, next_id);
			});
		},
		_setPosition = function(element, position) {
			if (element.length) element = element[0];
			if (options.vertical) element.style.top = position + 'px';
			else element.style.left = position + 'px';
		};
		self.next = function(direction) {
			var next_id = active_id + direction;
			if (next_id == -1) next_id = number - 1;
			if (next_id == number) next_id = 0;
			_calcPosition(next_id, direction);
		};
		self.go = function(next_id) {
			var direction = active_id < next_id ? 1 : -1;
			_calcPosition(next_id, direction);
		};
		self.slideshowStart = function() {
			if ( ! is_slideshow && $slideshow) {
				$slideshow.html(options.pauseText).addClass(options.slideshowPauseClass);
			}
			is_slideshow = 1;
			timer = w.setTimeout(function() {
				self.next(1);
				self.slideshowStart();
			}, options.timeout);
		};
		self.slideshowPause = function() {
			is_slideshow = 0;
			if ($slideshow) {
				$slideshow.html(options.playText).removeClass(options.slideshowPauseClass);
			}
			clearTimeout(timer);
		};
		return _construct();
	},
	
	submethod = function(callback) {
		return this.each(function() {
			var Slide = $.data(this, 'slides');
			if ( ! Slide) return;
			callback(Slide);
		});
	},
	
	methods = {
		init: function(options) {
			options = $.extend({}, defaults, options);
			return this.each(function() {
				var root = this;
				var slides = new Slides(root, options);
				$.data(root, 'slides', slides);
			});
		},
		go: function(page) {
			return submethod.call(this, function(Slide) {
				Slide.go(page - 1);
			});
		},
		prev: function() {
			return submethod.call(this, function(Slide) {
				Slide.next(-1);
			});
		},
		next: function() {
			return submethod.call(this, function(Slide) {
				Slide.next(1);
			});
		},
		play: function() {
			return submethod.call(this, function(Slide) {
				Slide.slideshowStart();
			});
		},
		pause: function() {
			return submethod.call(this, function(Slide) {
				Slide.slideshowPause();
			});
		}
	};
	
	$.fn.slides = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || ! method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.slides');
		}
	};
	
})(jQuery);
