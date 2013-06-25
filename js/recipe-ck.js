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
			   if(pair[0] === variable){return pair[1];}
	   }
	   return(false);
}

function arraymove(arr, fromIndex, toIndex) {
    element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

var keycodesToIgnore = [37,38,39,40];

var SAMPLE_RECIPE = '{"title":"Negroni","assembly":[{"context":"mixing glass","components":[{"context":"mixing glass","modifiers":[],"ingredients":[556],"rawText":"1 oz gin","rendering":"add 1.0 oz gin","valid":true,"measure":"1 oz","type":"AddMeasureOfIngredient"},{"context":"mixing glass","modifiers":[],"ingredients":[556],"rawText":"1 oz campari","rendering":"add 1.0 oz Campari","valid":true,"measure":"1 oz","type":"AddMeasureOfIngredient"},{"context":"mixing glass","modifiers":[],"ingredients":[556],"rawText":"1 oz red vermouth","rendering":"add 1.0 oz red vermouth","valid":true,"measure":"1 oz","type":"AddMeasureOfIngredient"},{"rawText":"add ice","modifiers":[],"ingredients":[1076],"rendering":"add ice","valid":true,"measure":"[UNDEFINED]","type":"AddUnmeasuredIngredient"},{"rawText":"stir","rendering":"stir","valid":true,"type":"stir"},{"rawText":"strain","rendering":"strain into serving vessel(s)","valid":true,"type":"strain"}]},{"context":"serving vessel","components":[{"rawText":"garnish with an orange wheel","modifiers":[],"ingredients":[1070],"rendering":"garnish with orange wheel","valid":true,"measure":"1","type":"GarnishWith"}]}],"servingVessel":"cocktail glass"}';

// == RECIPE

var recipeID = '';
var recipeTitle = '';
var recipeServings = 1;
var recipeAssembly = [];
var intendedServingVessel = 'cocktail glass';
var intendedServingVesselID = 5;
var lineIDCounter = 0;
var focusedContextIdx;  // this is an uncouth global... not sure what to do about it yet
var contextIdx;
var isModeEdit = false;
var inputFieldHasKeyboardFocus = false;

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

		contextContainer.append($('<span data-cidx="'+idx+'" class="btn btn-link rContextDelete"><i class="icon-remove-circle"></i></span>'));
		if (idx>0) {
			contextContainer.append($('<span data-cidx="'+idx+'" class="btn btn-link rContextUp"><i class="icon-arrow-up"></i></span>'));	
		}
		if (idx<recipeAssembly.length-1) {
			contextContainer.append($('<span data-cidx="'+idx+'" class="btn btn-link rContextDown"><i class="icon-arrow-down"></i></span>'));	
		}
		

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
		var contextDict = {
			context: recipeAssembly[$(this).data('cidx')].context,
			servings: recipeServings,
			servingVessels: [intendedServingVesselID]
		};
		var struct = {
					d: contextDict,
					l: $(this).data('str')
				};

		var jdata = JSON.stringify(struct);
		jQuery.ajax({
			type:'POST',
			url: '/rec/parseString', // the pyramid server
			data: jdata,
			contentType: 'application/json; charset=utf-8',
			success: function(data,status,jqXHR) {
				console.log(data);
				console.log('will add the above to context ',focusedContextIdx);
				recipeAssembly[focusedContextIdx].components.push(data);
				renderContexts();
			}
		});
	});


	$('.rContextDelete').click(function() {
		if ($(this).data('cidx')!==undefined) {
			recipeAssembly.splice($(this).data('cidx'),1);
			renderContexts();			
		}
	});
	$('.rContextDown').click(function() {
		if ($(this).data('cidx')!==undefined) {
			arraymove(recipeAssembly,$(this).data('cidx'),$(this).data('cidx')+1);
			renderContexts();			
		}
	});
	$('.rContextUp').click(function() {
		if ($(this).data('cidx')!==undefined) {
			arraymove(recipeAssembly,$(this).data('cidx'),$(this).data('cidx')-1);
			renderContexts();			
		}
	});

	$('.rLineDelete').click(function(){
		recipeAssembly[$(this).data('cidx')].components.splice($(this).data('idx'),1);
		renderContexts();
	});
	$('.rLineUp').click(function(){
		arraymove(recipeAssembly[$(this).data('cidx')].components,$(this).data('idx'),$(this).data('idx')-1);
		renderContexts();
	});
	$('.rLineDown').click(function(){
		arraymove(recipeAssembly[$(this).data('cidx')].components,$(this).data('idx'),$(this).data('idx')+1);
		renderContexts();
	});

	$('.rLineEdit').click(function(){
		//if ($(this).attr('disabled')==='disabled') {
		//	return false;
		//}
		isModeEdit = true;
		var lineID = $(this).data('lineid');
		$('#rLine'+lineID).hide();
		$('#rLineForm'+lineID).show();
		//$('.rLineEdit').attr('disabled','disabled');
		$('.rAddLineButton').attr('disabled','disabled');
		$('.rContextDelete').attr('disabled','disabled');
		$('.rLineDelete').attr('disabled','disabled');
		$('.addContextButton').attr('disabled','disabled');



		/*$('#rLineForm'+lineID).find('.lineInput').focus().keypress(function(e) {
			if (e.keyCode === 13) {
				console.log('handling enter for #rLineForm');
				var lineID = $(this).data('lineid');
				$('#doneButton'+lineID).click();
			}
			if (e.which === 27) {
				var lineID = $(this).data('lineid');
				$('#cancelButton'+lineID).click();
			}
		});*/
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
		line.html($('<p class="rLineEdit" data-lineid="'+lineIDCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'">'+component.rendering.replace('serving vessel(s)',intendedServingVessel)+'</p>'));
	} else {
		line.html($('<p class="rLineEdit" data-lineid="'+lineIDCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'">'+'{invalid component}'+'</p>'));
	}
	fieldset.append(line);
	var controls = $('<div id="rLineControls'+lineIDCounter+'" class="span3 rLineControls"></div>');
	if (componentIdx>0) {
		controls.append($('<span data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn btn-link rLineUp"><i class="icon-arrow-up"></i></span>'));	
	}
	if (componentIdx<context.components.length-1) {
		controls.append($('<span data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn btn-link rLineDown"><i class="icon-arrow-down"></i></span>'));	
	}
	//var editButton = $('<span id="editButton'+lineIDCounter+'" data-lineid="'+lineIDCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn btn-link rLineEdit"><i class="icon-edit"></i></span>');
	//controls.append(editButton);
	controls.append($('<span data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" class="btn btn-link rLineDelete"><i class="icon-remove"></i></span>'));
	fieldset.append(controls);

	return fieldset;

}

function editFormForLine(contextIdx,componentIdx) {

	var context = recipeAssembly[contextIdx];
	var component = {};
	var localLineCounter = lineIDCounter;
	var lineValid = true;
	if (componentIdx<99999) {
		component = context.components[componentIdx];
	} else {
		localLineCounter = 99999;
		lineValid = false;
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
	var lineStatus = $('<span id="lineValid'+localLineCounter+'" class="btn btn-link"><i class="icon-ban-circle"></i></span>');
	if (lineValid) {
		lineStatus = $('<span id="lineValid'+localLineCounter+'" class="btn btn-link"><i class="icon-ok-circle"></i></span>');
	}
	
	inputContainer.append(lineStatus);
	var inputField = $('<input class="span6 lineInput" id="lineInput'+localLineCounter+'" data-lineid="'+localLineCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" type="text" value="'+val+'">');
	inputField.data('form',form);
	var doneButton = $('<button class="btn doneButton" id="doneButton'+localLineCounter+'" data-lineid="'+localLineCounter+'" data-cidx="'+contextIdx+'" data-idx="'+componentIdx+'" type="button">Done</button>');
	if (lineValid) {
		doneButton.addClass('btn-primary');
	}	
	doneButton.data('form',form);
	var cancelButton = $('<button id="cancelButton'+localLineCounter+'" class="btn cancelButton" type="button">Cancel</button>');
	inputContainer.append(inputField);
	inputContainer.append(doneButton);
	inputContainer.append(cancelButton);
	var dropdownContainer = $('<div id="rKeywordMatchesParent" class="dropdown dropdown-tip dropdown-scroll"></div>');
	var keywordMatchesList = $('<ul id="rKeywordMatches'+localLineCounter+'" class="dropdown-menu" role="menu" aria-labelledby="dLabel"></ul>');
	dropdownContainer.append(keywordMatchesList);
	inputContainer.append(dropdownContainer);
	middlestuff.append($('<div id="feedback'+localLineCounter+'" class="inputFeedback"></div>'));

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
	/*
	inputField.keydown(function(e) {
		// trigger keyboard navigation of the matches, if any
		if (e.keyCode===38 || e.keyCode===40) {
			var searchResults = $('#rKeywordMatches'+$(this).data('lineid'));
			if (searchResults.find('li').length > 0) {
				$(this).blur();
				$('#kwMatch0').focus();
				e.preventDefault();
				e.stopPropagation();
			} else {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	});
	*/

	// text input handling
	inputField.keyup(function(e) {

		if (e.keyCode===38 || e.keyCode===40) {
			var searchResults = $('#rKeywordMatches'+$(this).data('lineid'));
			if (searchResults.find('li').length > 0) {
				$(this).blur();
				$('#kwMatch0').focus();
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		} else if (e.keyCode==27) {
			$('#cancelButton'+$(this).data('lineid')).click();
		}

		var lineString = $(this).val();
		var componentIdx = $(this).data('idx');
		var searchResults = $('#rKeywordMatches'+$(this).data('lineid'));
		var bits;
		var currentWord;
		var lastSpace;
		var thisGoddamnThing = $(this);

		window.log(e.keyCode);

		// handle escape key
		if (e.keyCode===27) {
			searchRestuls.empty();
			searchResults.hide();
			inputFieldHasKeyboardFocus = true;

			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		
		// handle enter key
		if (e.keyCode===13 && inputFieldHasKeyboardFocus) {
			console.log('ENTER KEY!!!');
			$('#doneButton'+$(this).data('lineid')).click();
		}
			
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
					var counter = -1;

					if (msg.length>0) {
						
						// erect choices
						for (var i = 0; i < msg.length; i++) {
							if (counter < 5) {
								//searchResults.append($('<li><a tabindex="-1" id="kwMatch'+i+'" data-val="'+msg[i].name+'" href="#">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
								if (msg[i].name.toLowerCase().indexOf(currentWord)===0) {
									counter += 1;
									searchResults.append($('<li><a tabindex="-1" id="kwMatch'+counter+'" data-val="'+msg[i].name+'" href="#">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
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
							counter += 1;
							searchResults.append($('<li><a tabindex="-1" id="kwMatch'+counter+'" data-val="'+msg[i].name+'" href="#">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
							
						}

						if (msg.length > counter) {
							searchResults.append($('<li class="divider"></li><li><em>... and '+(msg.length-counter)+' more</em></li>'));
						}

						// click handler
						searchResults.find('a').click(function(e) {
							e.preventDefault();
							searchResults.empty();
							searchResults.hide();
							inputField.val(lineString.replace(currentWord,$(this).data('val'))+' ');
							inputField.caret(inputField.val().length);
							inputField.focus();
							e.stopImmediatePropagation();
						});
						
						// add keyup/down support
						searchResults.find('a').keydown(function(e) {
							var items = $('[role=menu] li:not(.divider):visible a');
							var index = items.index(items.filter(':focus'));
							if (e.keyCode === 38 && index > 0) index-- ;									   // up
							if (e.keyCode === 40 && index < items.length - 1) index++   ;					 // down
							if (!~index) index = 0;
							inputFieldHasKeyboardFocus = false;
							items[index].focus();
						});

						searchResults.show();

					} else {
						searchResults.empty();
						searchResults.hide();
						inputFieldHasKeyboardFocus = true;
					}
				});
			} else {
				searchResults.empty();
				searchResults.hide();
				inputFieldHasKeyboardFocus = true;
			}

			// server parsing
			if (keycodesToIgnore.indexOf(e.keyCode)===-1) {

				var contextDict = {
					context: recipeAssembly[$(this).data('cidx')].context,
					servings: recipeServings,
					servingVessels: [intendedServingVesselID]
				};

				var struct = {
					d: contextDict,
					l: lineString
				};

				var jdata = JSON.stringify(struct);
				jQuery.ajax({
					type:'POST',
					url: '/rec/parseString', // the pyramid server
					data: jdata,
					contentType: 'application/json; charset=utf-8',
					success: function(data,status,jqXHR) {

						var lineID = thisGoddamnThing.data('lineid');

						var form = $('#rLineForm'+lineID);

						form.data('pendingComponent',data);

						bits = [];

						bits.push(data.rendering);

						if (data.valid) {
							$('#lineValid'+lineID).html('<i class="icon-ok-circle"></i>')
							$('#doneButton'+lineID).addClass('btn-primary');
						} else {
							$('#lineValid'+lineID).html('<i class="icon-ban-circle"></i>')
							$('#doneButton'+lineID).removeClass('btn-primary');
						}

						$('#feedback'+lineID).html(bits.join());

					}
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

	// - title field
	var titleField = $('<label>Recipe title</label><input type="text" id="recipeTitle" placeholder="Recipe title" />');
	$('#recipeContainer').append(titleField);
	titleField.change(function() {
		recipeTitle = $(this).val();
	});
	if (recipeTitle) {
		titleField.val(recipeTitle);
	}

	// - servings
	var servingsField = $('<label>No. Servings</label><input type="number" id="recipeServings" placeholder="1" />');
	$('#recipeContainer').append(servingsField);
	servingsField.change(function() {
		var val = $(this).val();
		if (val > 0) {
			recipeServings = val;
		} else {
			$(this).val(1);
		}
	});
	if (recipeServings) {
		servingsField.val(recipeServings);
	}

	// - serving vessel
	var servingVesselField = $('<label>Serving Vessel</label><select type="text" id="servingVessel"></select>');
	$('#recipeContainer').append(servingVesselField);
	jQuery.ajax({
		type:'GET',
		url: '/rec/barware', // the pyramid server
		contentType: 'application/json; charset=utf-8',
		async: false,
		success: function(msg,status,jqXHR) {
			for (var x=0; x<msg.length;x++) {
				$('#servingVessel').append($('<option value="'+msg[x][0]+'">'+msg[x][1]+'</option>'));
			}
		}
	});
	servingVesselField.change(function() {
		intendedServingVessel = $(this).find(":selected").text();
		intendedServingVesselID = $(this).val();

		renderContexts();
	});

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
	recipeBody.servings = recipeServings; 
	recipeBody.assembly = recipeAssembly;
	recipeBody.servingVessel = intendedServingVessel;
	recipeBody.servingVessels = [intendedServingVesselID];
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
			window.location = data;
		}
	});
}

function loadRecipe(jdata) {
	
	recipeTitle = jdata.title;
	intendedServingVessel = jdata.servingVessel;
	if (jdata.servingVessels !== undefined && jdata.servingVessels.length>0) {
		console.log('setting intendedServingVesselID to ',jdata.servingVessels[0]);
		intendedServingVesselID = jdata.servingVessels[0];	
	} else {
		intendedServingVesselID = 5;
	}
	
	recipeServings = jdata.servings;
	recipeAssembly = jdata.assembly;

	$('#recipeTitle').val(recipeTitle);
	console.log('setting servingsField to ', recipeServings);
	$('#recipeServings').val(recipeServings);
	//$('#servingVessel').val(intendedServingVessel);
	console.log('setting #servingVessel to ',intendedServingVesselID);
	$('#servingVessel').val(intendedServingVesselID);
	//$("#servingVessel").find("option[value='"+intendedServingVesselID+"']").attr('selected', 'selected');
	renderContexts();
}

jQuery(document).ready(function() {

	// Build and bootstrap our recipe
	bootstrapRecipe();

	if (getQueryVariable("id")) {
		recipeID = (getQueryVariable("id"));
		$.getJSON('/rec/fetch/'+recipeID,function(msg){
			loadRecipe(msg);
		});
	}

	// Bind enter key for convenience addline
	$(document).keypress(function(e) {
		if (e.which === 13) {
			$('.rAddLineButton.btn-primary').click();
		}
	});
	
	// recipe display page stuff
	$('#displayUnitsSelect').change(function() {
		var units = $(this).val();
		console.log('chose ',units);
		$('.variableUnits').each(function() {
			$(this).text($(this).data(units));
		});
	});

	// brain dead language stuff
	$('.lang-es').hide();
	$('#languageSelect').change(function() {
		$('.lang-en').hide();
		$('.lang-es').hide();
		
		$("#languageSelect option:selected").each(function() {
			console.log('showing .lang-'+$(this).val());
			$('.lang-'+$(this).val()).show();
		});
		
	});

});
