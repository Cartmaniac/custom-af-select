//
// Plugin author: Jure Zagoricnik
// Email: jure.zagoricnik@gmail.com
// Version: 5.0 (added support for placeholder & custom theme class)
//

;(function ($, window, document, undefined) {

	// Create the defaults once
	var pluginName = 'customSelect',
		defaults = {
			placeholder: '',
			multiple: false,
			linked: false,
			dataSingleUnselected: '',
			linkedName: '',
			linkedClass: '',
			simulate: false,
			themeClass: 'custom-select'
		};

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend( {}, defaults, options) ;
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	Plugin.prototype.init = function () {
		var elParent = $(this.element);
		var placeholder = $(this.element).attr('data-placeholder') || this.options.placeholder;
		var multiple = $(this.element).attr('data-multiple') || this.options.multiple;
		var dataSingleUnselected = $(this.element).attr('data-single-unselected') || this.options.dataSingleUnselected;
		var linked = $(this.element).attr('data-linked') || this.options.linked;
		var linkedName = $(this.element).attr('data-linked-name') || this.options.linkedName;
		var linkedClass = $(this.element).attr('data-linked-class') || this.options.linkedClass;
		var themeClass = $(this.element).attr('data-theme-class') || this.options.themeClass;
		var simulate;	// bool - if true, it executes click on option without opening/closing options popup

		//hide original select
		elParent.hide();

		//generate custom HTML
		function generateHtml() {
			var elText = elParent.find(":selected").text();
			var customHtml;
			var customHtmlSettings;
			var customHtmlSelected;
			var customHtmlTags;
			var customHtmlOptions;

			var customHtmlSettings = 
			'<div class="'+themeClass+' js-custom-select" data-multiple="'+multiple+'" data-linked="'+linked+'" data-linked-name="'+linkedName+'" data-linked-class="'+linkedClass+'">';

			if (placeholder != '') {
				customHtmlSelected = '' +
			'	<div class="'+themeClass+'-selected js-custom-select-selected">'+placeholder+'</div>';
			} else {
				customHtmlSelected = '' +
			'	<div class="'+themeClass+'-selected js-custom-select-selected">'+elText+'</div>';	
			}

			var customHtmlTags = '' +
			'	<div class="'+themeClass+'-tags dragscroll js-custom-select-tags">' +
			'		<ul class="'+themeClass+'-tags-list js-custom-select-tags-list"></ul>' +
			'	</div>';

			customHtmlOptions = '' +
			'	<ul class="'+themeClass+'-options js-custom-select-options">';

			elParent.find('option').each(function(index) {
				var elVal = $(this).val();
				var elText = $(this).text();
				var attr = $(this).attr('data-single');

				if (index == 0) {
					if (placeholder != '') {
						customHtmlOptions += 
					'<li data-value="'+elVal+'">'+elText+'</li>';
					} else if (attr) {
						customHtmlOptions += 
					'<li data-single="true" data-value="'+elVal+'" class="selected">'+elText+'</li>';
					} else {
						customHtmlOptions += 
					'<li data-value="'+elVal+'" class="selected">'+elText+'</li>';
					}
				} else {
					if (attr) {
						customHtmlOptions += 
					'<li data-single="true" data-value="'+elVal+'">'+elText+'</li>';
					} else {
						customHtmlOptions += 
					'<li data-value="'+elVal+'">'+elText+'</li>';
					}
				}
			});

			customHtmlOptions += 
			'	</ul>' +
			'</div>';

			customHtml = customHtmlSettings + customHtmlSelected + customHtmlTags + customHtmlOptions;

			return customHtml;
		}

		//append HTML
		elParent.after(generateHtml());

		$(this.element).parent().find('.js-custom-select-selected').click(function() {
			toggleOptions($(this).parent());
			//console.log('multiple: ' +multiple)
		});

		//option on click
		$(this.element).parent().find('.js-custom-select-options li').click(function() {
			optionClicked($(this), multiple);
		});

		//tag on click
		if (multiple) {
			$(this.element).parent().on('click', '.js-tag em', function() {
				removeTag($(this), linkedName);
			});
		}

		//linked element
		if (linked) {
			var linkedElement = $('.'+linkedClass+'[data-linked-name="'+linkedName+'"]')
			
			$('body').find(linkedElement).find('input').click(function() {
				updateCustomSelect($(this));
			});
		}

		//toggleOptions
		function toggleOptions(element) {
			if (element.hasClass('open')) {
				element.removeClass('open');
				element.find('.js-custom-select-options').slideUp(200);
			} else {
				element.addClass('open');
				element.find('.js-custom-select-options').slideDown(200);
			}
		}

		//optionClicked
		function optionClicked(element, multiple, simulate) {
			var elVal = element.attr('data-value');

			//update selected text
			setSelectedText(element);

			//select/unselect options
			if (element.hasClass('selected') && !element.is('[data-single]')) {
				if (multiple) {
					element.removeClass('selected');
					removeTag(element.parent().parent().find('.js-tag[data-value="'+elVal+'"] em'), linkedName);
				}
			} else {
				//check if option is single select and deselect all but this
				if (element.is('[data-single]')) {
					if (multiple) {
						removeTag(element.parent().parent().find('.js-tag em'));
						element.addClass('selected').siblings().removeClass('selected');
					} else {
						element.addClass('selected').siblings().removeClass('selected');
					}

					if (linked) {
						linkedElement.find('input:not("#'+elVal+'")').prop('checked', false);
						linkedElement.find('input#'+elVal).prop('checked', true);
					}

					if (!simulate) {
						toggleOptions(element.parent().parent());
					}
					return;
				}

				//normal toggle
				if (multiple) {
					element.parent().find('li[data-single]').removeClass('selected');
					element.addClass('selected')
				} else {
					element.addClass('selected').siblings().removeClass('selected');
				}
				
				if (multiple || linked) {
					addTag(element, linkedName);
				}
			}

			//close options
			if (!simulate) {
				toggleOptions(element.parent().parent());
			}
		}

		//setSelectedText
		function setSelectedText(element) {
			var txtVal;

			if (element.is('[data-single]')) {
				txtVal = element.text();
			} else {
				if (dataSingleUnselected != '') {
					txtVal = dataSingleUnselected;
				} else {
					txtVal = element.text();
				}
			}

			element.closest('.js-custom-select').find('.js-custom-select-selected').text(txtVal);
		}

		//addTag
		function addTag(element) {
			//console.log('addTag')
			var elText = element.text();
			var elVal = element.attr('data-value');
			var tagHtml = '<li class="tag-item js-tag" data-value="'+elVal+'">'+elText+'<em></em></li>';
			var elTagsList = element.closest('.js-custom-select').find('.js-custom-select-tags-list');
			var elTags = elTagsList.parent();

			elTagsList.append(tagHtml);

			if (linked) {
				linkedElement.find('input[data-single="true"]').prop('checked', false);
				linkedElement.find('input#'+elVal).prop('checked', true);
			}

			//check if you need to scroll
			//console.log('tagscroll: ' + elTagsList[0].scrollWidth)
			if (elTagsList[0].scrollWidth != undefined) {
				if (elTags.width() < elTagsList[0].scrollWidth) {
					elTags.addClass('scroll-me');
					//elTags.addClass('scroll-me').slider();
				} else {
					elTags.removeClass('scroll-me');
				}
			}
		}

		//removeTag
		function removeTag(element) {
			//console.log('removeTag')
			element = element.parent();
			var elVal = element.attr('data-value');
			var totalTags = element.siblings().length;
			var elOptions = element.closest('.js-custom-select').find('.js-custom-select-options li');
			var elOption = element.closest('.js-custom-select').find('.js-custom-select-options li[data-value="'+elVal+'"]')

			elOption.removeClass('selected');
			element.remove();

			if (totalTags == 0) {
				if (elOptions.is('[data-single]')) {
					elOptions.siblings('[data-single]').addClass('selected');
					setSelectedText(elOptions.siblings('[data-single]'));

					if (linked) {
						linkedElement.find('input[data-single]').prop('checked', true);
					}
				} else {
					setSelectedText(elOption);
				}
			}

			if (linked) {
				linkedElement.find('input#'+elVal).prop('checked', false);
			}
		}

		//updateCustomSelect
		function updateCustomSelect(element) {
			var elVal = element.attr('id');
			//console.log('linkedName: ' + linkedName)
			var el = $('.js-custom-select[data-linked-name="'+linkedName+'"]').find('li[data-value="'+elVal+'"]');
			//console.log('updateCustomSelect: ' +elVal);

			optionClicked(el, multiple, true);
		}
	};

	// A really lightweight plugin wrapper around the constructor, 
	// preventing against multiple instantiations
	$.fn[pluginName] = function ( options ) {
		return this.each(function () {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, 
				new Plugin( this, options ));
			}
		});
	}

})( jQuery, window, document );