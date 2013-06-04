(function($) {
  $.fn.caret = function(pos) {
    var target = this[0];
    //get
    if (arguments.length == 0) {
      //HTML5
      if (window.getSelection) {
        //contenteditable
        if (target.contentEditable == 'true') {
          target.focus();
          var range1 = window.getSelection().getRangeAt(0),
              range2 = range1.cloneRange();
          range2.selectNodeContents(target);
          range2.setEnd(range1.endContainer, range1.endOffset);
          return range2.toString().length;
        }
        //textarea
        return target.selectionStart;
      }
      //IE<9
      if (document.selection) {
        target.focus();
        //contenteditable
        if (target.contentEditable == 'true') {
            var range1 = document.selection.createRange(),
                range2 = document.body.createTextRange();
            range2.moveToElementText(target);
            range2.setEndPoint('EndToEnd', range1);
            return range2.text.length;
        }
        //textarea
        var pos = 0,
            range = target.createTextRange(),
            range2 = document.selection.createRange().duplicate(),
            bookmark = range2.getBookmark();
        range.moveToBookmark(bookmark);
        while (range.moveStart('character', -1) !== 0) pos++;
        return pos;
      }
      //not supported
      return 0;
    }
    //set
    //HTML5
    if (window.getSelection) {
      //contenteditable
      if (target.contentEditable == 'true') {
        target.focus();
        window.getSelection().collapse(target.firstChild, pos);
      }
      //textarea
      else
        target.setSelectionRange(pos, pos);
    }
    //IE<9
    else if (document.body.createTextRange) {
      var range = document.body.createTextRange();
      range.moveToElementText(target)
      range.moveStart('character', pos);
      range.collapse(true);
      range.select();
    }
  }
})(jQuery)

/* **********************************************
     Begin recipe.js
********************************************** */

// @codekit-prepend "jquery.caret.js";
/*global log */
/*global console */

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

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

var keycodesToIgnore = [37,38,39,40];

var SAMPLE_RECIPE = '{"title":"Negroni","assembly":[{"context":"mixing glass","components":[{"context":"mixing glass","modifiers":[],"ingredients":[556],"rawText":"1 oz gin","rendering":"add 1.0 oz gin","valid":true,"measure":"1 oz","type":"AddMeasureOfIngredient"},{"context":"mixing glass","modifiers":[],"ingredients":[556],"rawText":"1 oz campari","rendering":"add 1.0 oz Campari","valid":true,"measure":"1 oz","type":"AddMeasureOfIngredient"},{"context":"mixing glass","modifiers":[],"ingredients":[556],"rawText":"1 oz red vermouth","rendering":"add 1.0 oz red vermouth","valid":true,"measure":"1 oz","type":"AddMeasureOfIngredient"},{"rawText":"add ice","modifiers":[],"ingredients":[1076],"rendering":"add ice","valid":true,"measure":"[UNDEFINED]","type":"AddUnmeasuredIngredient"},{"rawText":"stir","rendering":"stir","valid":true,"type":"stir"},{"rawText":"strain","rendering":"strain into serving vessel(s)","valid":true,"type":"strain"}]},{"context":"serving vessel","components":[{"rawText":"garnish with an orange wheel","modifiers":[],"ingredients":[1070],"rendering":"garnish with orange wheel","valid":true,"measure":"1","type":"GarnishWith"}]}],"servingVessel":"cocktail glass"}';

// == RECIPE

var recipeID = '';
var recipeTitle = '(untitled)';
var recipeAssembly = [];
var intendedServingVessel = 'cocktail glass';
var lineIDCounter = 0;
var focusedContextIdx;  // this is an uncouth global... not sure what to do about it yet
var contextIdx;
var isModeEdit = false;

function renderContexts() {

	$('#rAssembly').empty();
	isModeEdit = false;

	for (var idx=0; idx < recipeAssembly.length; idx++) {

		var context = recipeAssembly[idx];
		var components = context.components;

		var contextContainer = $('<div id="rContextContainer'+idx+'" class="rContextContainer"></div>');
		$('#rAssembly').append(contextContainer);

		if (context.context!=='serving vessel') {
			contextContainer.append($('<h4>'+context.context+'</h4>'));	
		} else {
			contextContainer.append($('<h4>'+intendedServingVessel+'</h4>'));
		}

		var deleteButton = $('<span id="delContext'+idx+'" data-cidx="'+idx+'" class="btn btn-link rContextDelete"><i class="icon-remove-circle"></i></span>');
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

		// context-actions
		var contextBottomControls = $('<div id="contextControlsBottom'+idx+'"></div>');
		contextContainer.append(contextBottomControls);

		var addLineButton = $('<span id="addButton'+idx+'" data-cidx="'+idx+'" class="btn rAddLineButton">Add line</span>');
		contextBottomControls.append(addLineButton);
		contextContainer.click(function() {
			contextFocus = $(this);
			$('.rAddLineButton').removeClass('btn-primary');
			$('.rContextContainer').removeClass('focused');
			$(this).find('.rAddLineButton').addClass('btn-primary');
			$(this).addClass('focused');
		});

		// == macros ==
		contextBottomControls.append('<button class="btn btn-link" disabled="disabled">or append:</button>');
		var macroButtonGroup;
		var macroButtonSubOptions;

		if (context.context!='serving vessel') {
			macroButtonGroup = $('<div class="btn-group"></div>');
			contextBottomControls.append(macroButtonGroup);
			macroButtonGroup.append($('<span data-cidx="'+idx+'" data-str="add ice" class="btn strMacro">Add ice</span>'));
			macroButtonGroup.append('<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>');
			macroButtonSubOptions = $('<ul class="dropdown-menu"></ul>');
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="add cracked ice" href="#">add cracked ice</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="add crushed ice" href="#">add crushed ice</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="add big ice" href="#">add big ice</a></li>'));
			macroButtonGroup.append(macroButtonSubOptions);

			macroButtonGroup = $('<div class="btn-group"></div>');
			contextBottomControls.append(macroButtonGroup);
			macroButtonGroup.append($('<span data-cidx="'+idx+'" data-str="shake" class="btn strMacro">Shake</span>'));
			macroButtonGroup.append('<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>');
			macroButtonSubOptions = $('<ul class="dropdown-menu"></ul>');
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="dry shake" href="#">dry shake</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="roll" href="#">roll</a></li>'));
			macroButtonGroup.append(macroButtonSubOptions);

			contextBottomControls.append($('<span data-cidx="'+idx+'" data-str="stir" class="btn strMacro">Stir</span>'));

			macroButtonGroup = $('<div class="btn-group"></div>');
			contextBottomControls.append(macroButtonGroup);
			macroButtonGroup.append($('<span data-cidx="'+idx+'" data-str="strain" class="btn strMacro">Strain into '+intendedServingVessel+'</span>'));
			macroButtonGroup.append('<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>');
			macroButtonSubOptions = $('<ul class="dropdown-menu"></ul>');
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="pour" href="#">pour into '+intendedServingVessel+'</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="fine strain" href="#">fine strain into '+intendedServingVessel+'</a></li>'));
			macroButtonGroup.append(macroButtonSubOptions);

		}

		if (context.context==='serving vessel') {
			macroButtonGroup = $('<div class="btn-group"></div>');
			contextBottomControls.append(macroButtonGroup);
			macroButtonGroup.append($('<span data-cidx="'+idx+'" data-str="fill with ice" class="btn strMacro">fill with ice</span>'));
			macroButtonGroup.append('<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>');
			macroButtonSubOptions = $('<ul class="dropdown-menu"></ul>');
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="fill with crushed ice" href="#">fill with crushed ice</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="fill with big ice" href="#">add big ice</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="top with crushed ice" href="#">top with crushed ice</a></li>'));
			macroButtonGroup.append(macroButtonSubOptions);

			contextBottomControls.append($('<span data-cidx="'+idx+'" data-str="stir" class="btn strMacro">Stir</span>'));

			macroButtonGroup = $('<div class="btn-group"><button class="btn btn-link" disabled="disabled">garnishing:</button></div>');
			contextBottomControls.append(macroButtonGroup);
			macroButtonGroup.append($('<span data-cidx="'+idx+'" data-str="garnish with a lemon twist" class="btn strMacro">lemon twist</span>'));
			macroButtonGroup.append('<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>');
			macroButtonSubOptions = $('<ul class="dropdown-menu"></ul>');
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="garnish with a cherry" href="#">cherry</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="garnish with an orange wheel" href="#">orange wheel</a></li>'));
			macroButtonSubOptions.append($('<li><a tabindex="-1" data-cidx="'+idx+'" class="strMacro" data-str="garnish with a lime wheel" href="#">lime wheel</a></li>'));
			macroButtonGroup.append(macroButtonSubOptions);			
		}
		



	}

	$('.rAddLineButton').last().addClass('btn-primary');
	$('.rContextContainer').last().addClass('focused');

	$('.rAddLineButton').click(function(){
		if (! isModeEdit) {
			var contextIdx = $(this).data('cidx');
			var lineForm = editFormForLine(contextIdx,99999);
			$('#rContextContainer'+contextIdx).append(lineForm);
			$('#contextControlsBottom'+contextIdx).hide();
			$('#lineInput99999').focus();
			isModeEdit=true;
		}
	});

	$('.strMacro').click(function() {
		focusedContextIdx = $(this).data('cidx');
		var context = recipeAssembly[$(this).data('cidx')];
		var struct = {
					c: recipeAssembly[$(this).data('cidx')].context,
					l: $(this).data('str')
				};
		$.getJSON('/rec/parseString/'+JSON.stringify(struct),function(msg){
			console.log(msg);
			console.log('will add the above to context ',focusedContextIdx);
			recipeAssembly[focusedContextIdx].components.push(msg);
			renderContexts();
		});
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
		isModeEdit = true;
		var lineID = $(this).data('lineid');
		$('#rLine'+lineID).hide();
		$('#rLineForm'+lineID).show();
		$('.rLineEdit').attr('disabled','disabled');
		$('.rAddLineButton').attr('disabled','disabled');
		$('.rContextDelete').attr('disabled','disabled');
		$('.rLineDelete').attr('disabled','disabled');
		$('.addContextButton').attr('disabled','disabled');
		$('#rLineForm'+lineID).find('.lineInput').focus().keypress(function(e) {
			console.log('key: ',e.keyCode);
			if (e.keyCode === 13) {
				var lineID = $(this).data('lineid');
				$('#doneButton'+lineID).click();
			}
			if (e.which === 27) {
				var lineID = $(this).data('lineid');
				$('#cancelButton'+lineID).click();
			}
		});
	});

	var addContextRow = $('<div id="addContexts"><button class="btn btn-link" disabled="disabled">switch to:</button></div>');
	$('#rAssembly').append(addContextRow);
	var addContextServingVessel = $('<input class="btn btn-small addContextButton" type="button" value="'+intendedServingVessel+'">');
	var addContextMixingGlass = $('<input class="btn btn-small addContextButton" type="button" value="mixing glass">');
	var addContextShaker = $('<input class="btn btn-small addContextButton" type="button" value="shaker">');
	var addContextBlender = $('<input class="btn btn-small addContextButton" type="button" value="blender">');

	var lastContext;
	if (recipeAssembly.length > 0) {
		lastContext = recipeAssembly.slice(-1)[0].context;
	}

	if (lastContext !== 'serving vessel') {
		addContextRow.append(addContextServingVessel);	
	}
	if (lastContext !== 'mixing glass') {
		addContextRow.append(addContextMixingGlass);
	}
	if (lastContext !== 'shaker') {
		addContextRow.append(addContextShaker);
	}
	if (lastContext !== 'blender') {
		addContextRow.append(addContextBlender);	
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
		line.html($('<p>'+component.rendering.replace('serving vessel(s)',intendedServingVessel)+'</p>'));
	} else {
		line.html($('<p>'+'{invalid component}'+'</p>'));
	}
	fieldset.append(line);
	var controls = $('<div id="rLineControls'+lineIDCounter+'" class="span3 rLineControls"></div>');
	var editButton = $('<span id="editButton'+lineIDCounter+'" data-lineid="'+lineIDCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn btn-link rLineEdit"><i class="icon-edit"></i></span>');
	var deleteButton = $('<span id="deleteButton'+lineIDCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn btn-link rLineDelete"><i class="icon-remove"></i></span>');
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
	if (component.rawText) {
		val = component.rawText;
	} else if (component.rendering) {
		val = component.rendering;
	}
	var middlestuff = $('<div class="span8"></div>');
	fieldset.append(middlestuff);
	var inputContainer = $('<div class="input-append"></div>');
	middlestuff.append(inputContainer);
	var inputField = $('<input class="span6 lineInput" id="lineInput'+localLineCounter+'" data-lineid="'+localLineCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" type="text" value="'+val+'">');
	inputField.data('form',form);
	var doneButton = $('<button class="btn doneButton" id="doneButton'+localLineCounter+'" data-lineid="'+localLineCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" type="button">Done</button>');
	doneButton.data('form',form);
	var cancelButton = $('<button id="cancelButton'+localLineCounter+'" class="btn cancelButton" type="button">Cancel</button>');
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
							if (e.keyCode === 38 && index > 0) index-- ;                                       // up
							if (e.keyCode === 40 && index < items.length - 1) index++   ;                     // down
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

function bootstrapRecipe(recipeData) {

	// front matter
	var titleField = $('<input type="text" id="recipeTitle" placeholder="Recipe title" />');
	$('#recipeContainer').append(titleField);
	titleField.change(function() {
		recipeTitle = $(this).val();
	});
	if (recipeTitle) {
		titleField.val(recipeTitle);
	}
	var servingVesselField = $('<input type="text" id="servingVessel" placeholder="Serving vessel" />');
	$('#recipeContainer').append(servingVesselField);
	servingVesselField.change(function() {
		intendedServingVessel = $(this).val();
		renderContexts();
	});
	if (intendedServingVessel) {
		servingVesselField.val(intendedServingVessel);
	}
	// container for the contexts
	$('#recipeContainer').append($('<div id="rAssembly"></div>'));

	// recipe submit button
	var submitButton = $('<button class="btn btn-success btn-block" type="button">Submit recipe</button>');
	$('#recipeContainer').append(submitButton);
	submitButton.click(submitRecipe);

	// render the contexts
	renderContexts();
}

function packageRecipe() {
	var recipeBody = {};
	recipeBody.recipeID = recipeID;
	recipeBody.title = recipeTitle; 
	recipeBody.assembly = recipeAssembly;
	recipeBody.servingVessel = intendedServingVessel;
	return recipeBody;
}

function submitRecipe() {
	$('#inputFeedback').text(JSON.stringify(packageRecipe()));
	var jdata = JSON.stringify(packageRecipe());
	jQuery.ajax({
		type:'POST',
        url: '/rec/submitrecipe', // the pyramid server
        data: jdata,
        contentType: 'application/json; charset=utf-8',
        success: function(data,status,jqXHR) {
        	console.log('got back: ',data,status);
        }
    });
}

function loadRecipe(jdata) {
	recipeAssembly = jdata.assembly;
	intendedServingVessel = jdata.servingVessel;
	$('#servingVessel').val(intendedServingVessel);
	recipeTitle = jdata.title;
	$('#recipeTitle').val(recipeTitle);
	renderContexts();
}

jQuery(document).ready(function() {

	if (getQueryVariable("id")) {
		recipeID = (getQueryVariable("id"));
		$.getJSON('/rec/fetch/'+recipeID,function(msg){
			loadRecipe(msg);
		});
	}

	// sample recipe
	//var recipeData = $.parseJSON(SAMPLE_RECIPE);
	//recipeAssembly = recipeData.assembly;
	//intendedServingVessel = recipeData.servingVessel;
	//recipeTitle = recipeData.title;

	
	/*recipeAssembly = [{"context":"mixing glass"}];
	recipeAssembly[0].components = [
		{"context":"mixing glass", "modifiers": [], "ingredients": [556], "rawText":"1 oz gin", "rendering": "add 1.0 oz gin", "valid": true, "measure": "1 oz", "type": "AddMeasureOfIngredient"},
		{"context":"mixing glass", "modifiers": [], "ingredients": [556], "rawText":"1 oz campari", "rendering": "add 1.0 oz Campari", "valid": true, "measure": "1 oz", "type": "AddMeasureOfIngredient"},
		{"context":"mixing glass", "modifiers": [], "ingredients": [556], "rawText":"1 oz red vermouth", "rendering": "add 1.0 oz red vermouth", "valid": true, "measure": "1 oz", "type": "AddMeasureOfIngredient"}
		];
	*/

	// Build and bootstrap our recipe
	bootstrapRecipe();

	// Bind enter key for convenience addline
	$(document).keypress(function(e) {
		if (e.which === 13) {
			$('.rAddLineButton.btn-primary').click();
		}
	});
	

});
