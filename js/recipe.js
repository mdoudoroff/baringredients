// @codekit-prepend "jquery.caret.js";

window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};

function fixEncoding(s) {
	s = s.replace('/','@');
	return s;
}

var keycodesToIgnore = [37,38,39,40];

// == RECIPE
var recipeAssembly = [{"context":"mixing glass"}];
recipeAssembly[0].components = [
	{"context":"mixing glass", "modifiers": [], "ingredients": [556], "rawText":"1 oz gin", "rendering": "add 1.0 oz gin", "valid": true, "measure": "1 oz", "type": "AddMeasureOfIngredient"},
	{"context":"mixing glass", "modifiers": [], "ingredients": [556], "rawText":"1 oz campari", "rendering": "add 1.0 oz Campari", "valid": true, "measure": "1 oz", "type": "AddMeasureOfIngredient"},
	{"context":"mixing glass", "modifiers": [], "ingredients": [556], "rawText":"1 oz red vermouth", "rendering": "add 1.0 oz red vermouth", "valid": true, "measure": "1 oz", "type": "AddMeasureOfIngredient"}
	];

var lineIDCounter = 0;

function renderContexts() {

	$('#recipeContainer').empty();

	for (var idx=0; idx < recipeAssembly.length; idx++) {

		var context = recipeAssembly[idx];
		var components = context.components;

		var contextContainer = $('<div id="rContextContainer'+idx+'" class="rContextContainer"></div>');
		$('#recipeContainer').append(contextContainer);

		contextContainer.append($('<h3>'+context.context+'</h3>'));

		var deleteButton = $('<span id="delContext'+idx+'" data-cidx="'+idx+'" class="btn rContextDelete">X</span>');
		contextContainer.append(deleteButton);

		for (var componentIdx=0; componentIdx < components.length; componentIdx++ ) {

			var component = components[componentIdx];

			lineIDCounter += 1;

			// -- line container
			var lineContainer = $('<div id="rLineContainer'+lineIDCounter+'" class="rLineContainer"></div>');
			contextContainer.append(lineContainer);

			// -- the line (component representation)
			var linerep = lineRepForLine(idx,componentIdx);
			lineContainer.append(linerep);
			if (! component.valid) {
				linerep.hide();
			}

			// -- the form for the line
			var lineForm = editFormForLine(idx,componentIdx);
			lineContainer.append(lineForm);
			if (component.valid) {
				lineForm.hide();
			}

		}
		var addLineButton = $('<span id="addButton'+idx+'" data-cidx="'+idx+'" class="btn btn-primary rAddLineButton">Add line</span>');
		contextContainer.append(addLineButton);
	}

	$('.rAddLineButton').click(function(){
		var contextIdx = $(this).data('cidx');
		var lineForm = editFormForLine(contextIdx,99999);
		$('#rContextContainer'+contextIdx).append(lineForm);
		$(this).hide();
		$('#lineInput99999').focus();
	});

	$('.rContextDelete').click(function() {
		recipeAssembly.splice($(this).data('idx'),1);
		renderContexts();
	});

	$('.rLineDelete').click(function(){
		recipeAssembly[$(this).data('cidx')].components.splice($(this).data('idx'),1);
		renderContexts();
	});

	$('.rLineEdit').click(function(){
		if ($(this).attr('disabled')==='disabled') {
			return false;
		}
		var lineID = $(this).data('lineid');
		window.log($(this).data('cidx'));
		window.log(lineID);
		$('#rLine'+lineID).hide();
		$('#rLineForm'+lineID).show();
		$('.rLineEdit').attr('disabled','disabled');
	});


	var addContextServingVessel = $('<input class="btn" type="button" value="serving vessel">');
	var addContextMixingGlass = $('<input class="btn" type="button" value="mixing glass">');
	var addContextShaker = $('<input class="btn" type="button" value="shaker">');
	var addContextBlender = $('<input class="btn" type="button" value="blender">');

	var lastContext;
	if (recipeAssembly.length > 0) {
		lastContext = recipeAssembly.slice(-1)[0].context;
	}

	if (lastContext !== 'serving vessel') {
		$('#recipeContainer').append(addContextServingVessel);	
	}
	if (lastContext !== 'mixing glass') {
		$('#recipeContainer').append(addContextMixingGlass);
	}
	if (lastContext !== 'shaker') {
		$('#recipeContainer').append(addContextShaker);
	}
	if (lastContext !== 'blender') {
		$('#recipeContainer').append(addContextBlender);	
	}

	addContextServingVessel.click(function() {
		recipeAssembly.push({"context":"serving vessel","components":[]});
		renderContexts();
	});

	addContextMixingGlass.click(function() {
		recipeAssembly.push({"context":"mixing glass","components":[]});
		renderContexts();
	});

	addContextShaker.click(function() {
		recipeAssembly.push({"context":"shaker","components":[]});
		renderContexts();
	});

	addContextBlender.click(function() {
		recipeAssembly.push({"context":"blender","components":[]});
		renderContexts();
	});

	// debug output
	$('#inputFeedback').empty();
	for (var x=0; x < recipeAssembly.length; x++) {
		var context = recipeAssembly[x];
		for (var y=0; y < context.components.length; y++) {
			//$('#inputFeedback').append($('<p>'+syntaxHighlight(context.components[y])+'</p>'));		
			$('#inputFeedback').append($('<p>'+JSON.stringify(context.components[y])+'</p>'));
		}
	}
	
}

function lineRepForLine(contextIdx,componentIdx) {

	var context = recipeAssembly[contextIdx];
	var component = context.components[componentIdx];
	
	var fieldset = $('<div id="rLine'+lineIDCounter+'" class="lineRep"></div>');

	var line = $('<div class="span8"></div>');
	if (component.valid) {
		line.html($('<p>'+component.rendering+'</p>'));
	} else {
		line.html($('<p>'+'{invalid component}'+'</p>'));
	}
	fieldset.append(line);
	var controls = $('<div id="rLineControls'+lineIDCounter+'" class="span3"></div>');
	var editButton = $('<span id="editButton'+lineIDCounter+'" data-lineid="'+lineIDCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn rLineEdit">Edit</span>');
	var deleteButton = $('<span id="deleteButton'+lineIDCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn rLineDelete">X</span>');
	controls.append(editButton);
	controls.append(deleteButton);
	fieldset.append(controls);

	return fieldset;

}

function editFormForLine(contextIdx,componentIdx) {

	var context = recipeAssembly[contextIdx];
	var component = {};
	var localLineCounter = lineIDCounter;
	if (componentIdx<99999) {
		component = context.components[componentIdx];
	} else {
		localLineCounter = 99999;
	}
	
	// container
	var form = $('<form action="" id="rLineForm'+localLineCounter+'" class="form-horizontal lineForm"></form>');
	var fieldset = $('<fieldset></fieldset>');
	form.append(fieldset);

	form.data('pendingComponent',component);

	// text input/submit/cancel
	var val = '';
	window.log('> ', component.rawText);
	if (component.rawText) {
		val = component.rawText;
	} else if (component.rendering) {
		val = component.rendering;
	}
	var middlestuff = $('<div class="span8"></div>');
	fieldset.append(middlestuff);
	var inputContainer = $('<div class="input-append"></div>');
	middlestuff.append(inputContainer);
	var inputField = $('<input class="span6" id="lineInput'+localLineCounter+'" data-lineid="'+localLineCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" type="text" value="'+val+'">');
	inputField.data('form',form);
	var doneButton = $('<button class="btn" id="doneButton'+localLineCounter+'" data-lineid="'+localLineCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" type="button">Done</button>');
	doneButton.data('form',form);
	var cancelButton = $('<button id="cancelButton'+localLineCounter+'" class="btn" type="button">Cancel</button>');
	inputContainer.append(inputField);
	inputContainer.append(doneButton);
	inputContainer.append(cancelButton);
	var dropdownContainer = $('<div id="rKeywordMatchesParent" class="dropdown dropdown-tip dropdown-scroll"></div>');
	var keywordMatchesList = $('<ul id="rKeywordMatches'+localLineCounter+'" class="dropdown-menu" role="menu" aria-labelledby="dLabel"></ul>');
	dropdownContainer.append(keywordMatchesList);
	inputContainer.append(dropdownContainer);
	middlestuff.append($('<div id="feedback'+localLineCounter+'"></div>'));

	// prevent form submission
	form.submit(function(e) {
		window.log('submit!');
		e.preventDefault();
	});

	// done button binding
	doneButton.click(function() {
		var form = $(this).data('form');
		var pendingComponent = form.data('pendingComponent');
		var context = recipeAssembly[$(this).data('cidx')];
		var componentIdx = $(this).data('idx');
		if (pendingComponent.valid) {
			if (componentIdx < 99999) {
				context.components[componentIdx] = pendingComponent;
			} else {
				context.components.push(pendingComponent);
			}
			renderContexts();
		} else {
			$('#feedback'+$(this).data('lineID')).text('Error: invalid component; please correct.');
		}
		return false;
	});
	cancelButton.click(function() {
		renderContexts();
	});


	// control some input
	inputField.keydown(function(e) {
		// trigger keyboard navigation of the matches, if any
		if (e.keyCode===38 || e.keyCode===40) {
			var searchResults = $('#rKeywordMatches'+$(this).data('lineid'));
			if (searchResults.find('li').length > 0) {
				$(this).blur();
				$('#kwMatch0').focus();
			} else {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	});

	// text input handling
	inputField.keyup(function(e) {

		if (e.keyCode===38 || e.keyCode===40) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

		var lineString = $(this).val();
		var componentIdx = $(this).data('idx');
		var searchResults = $('#rKeywordMatches'+$(this).data('lineid'));
		var bits;
		var currentWord;
		var lastSpace;
		var thisGoddamnThing = $(this);

		window.log(e.keyCode);
		

		if (lineString.length > 1) {

			var cursorPos = $(this).caret();
			if (cursorPos) {
				lastSpace = lineString.lastIndexOf(' ',cursorPos);
				currentWord = (lineString.slice(lastSpace+1,lineString.length));
			} else {
				currentWord = '';
			}

			if (currentWord.charAt(currentWord.length-1)===' ') {
				currentWord = '';
			}
			window.log('currentWord: ', currentWord);

			if (currentWord.length>2) {
				$.getJSON('/search/ing/'+fixEncoding(currentWord),function(msg){

					var lineID = thisGoddamnThing.data('lineid');
					var searchResults = $('#rKeywordMatches'+lineID);
					searchResults.empty();  // <--- could result in a bug since this is an anonymous function
					var counter = 0;

					if (msg.length>0) {
						
						// erect choices
						for (var i = 0; i < msg.length; i++) {
							if (counter < 5) {
								//searchResults.append($('<li><a tabindex="-1" id="kwMatch'+i+'" data-val="'+msg[i].name+'" href="#">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
								if (msg[i].name.toLowerCase().indexOf(currentWord)===0) {
									counter += 1;
									searchResults.append($('<li><a tabindex="-1" id="kwMatch'+i+'" data-val="'+msg[i].name+'" href="#">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
								}
							}
						}
						// divider, if necessary
						if (counter > 0 && counter < 10) {
							searchResults.append($('<li class="divider"></li>'));
						}

						// then list the rest, space allowing
						for (i = 0; i < msg.length; i++) {
							if (counter > 100) {
								break;
							}
							searchResults.append($('<li><a tabindex="-1" id="kwMatch'+i+'" data-val="'+msg[i].name+'" href="#">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
							counter += 1;
						}

						if (msg.length > counter) {
							searchResults.append($('<li class="divider"></li><li><em>... and '+(msg.length-counter)+' more</em></li>'));
						}

						// click handler
						searchResults.find('a').click(function(e) {
							e.preventDefault();
							searchResults.hide();
							inputField.val(lineString.replace(currentWord,$(this).data('val'))+' ');
							inputField.caret(inputField.val().length);
						});
						
						// add keyup/down support
						searchResults.find('a').keydown(function(e) {
							var items = $('[role=menu] li:not(.divider):visible a');
							var index = items.index(items.filter(':focus'));
							if (e.keyCode == 38 && index > 0) index-- ;                                       // up
							if (e.keyCode == 40 && index < items.length - 1) index++   ;                     // down
							if (!~index) index = 0;
							items[index].focus();
						});

						searchResults.show();

					} else {
						searchResults.empty();
						searchResults.hide();
					}
				});
			} else {
				searchResults.empty();
				searchResults.hide();
			}

			// server parsing
			if (keycodesToIgnore.indexOf(e.keyCode)===-1) {

				var struct = {
					c: recipeAssembly[$(this).data('cidx')].context,
					l: lineString
				};

				//$.getJSON('/rec/parseString/'+fixEncoding(lineString),function(msg){
				$.getJSON('/rec/parseString/'+JSON.stringify(struct),function(msg){

					var lineID = thisGoddamnThing.data('lineid');

					var form = $('#rLineForm'+lineID);

					form.data('pendingComponent',msg);

					bits = [];

					bits.push(msg.rendering);

					if (msg.valid) {
						bits.push('VALID');
					} else {
						bits.push('INVALID');
					}

					$('#feedback'+lineID).text(bits.join());

				});
			}

		} else {
			$('#feedback'+componentIdx).empty();
		}
	});

	return form;
}

jQuery(document).ready(function() {

	renderContexts();

});
