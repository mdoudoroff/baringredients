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

jQuery(document).ready(function() {



	// == PRICE FORM STUFF ==

	// dynamic search binding (keyup-based)
	// note: returns all results, not just "top" results, so maybe a variant is needed for "drop down"-type results presentation
	$('#rLine').keyup(function(e) {
		


		var lineString = $('#rLine').val();
		var searchResults = $('#rKeywordMatches');
		var bits;
		var currentWord;
		var lastSpace;
		if (lineString.length > 1) {

			var cursorPos = $('#rLine').caret();
			if (cursorPos) {
				lastSpace = lineString.lastIndexOf(' ',cursorPos);
				currentWord = (lineString.slice(lastSpace+1,cursorPos));
			} else {
				currentWord = '';
			}

			if (currentWord.length>2) {
				$.getJSON('/search/ing/'+fixEncoding(currentWord),function(msg){

					searchResults.empty();

					if (msg.length>0) {
						
						searchResults.append($('<ul>'));

						for (var i = 0; i < 10; i++) {
							if (i < msg.length) {
								searchResults.append($('<li><a tabindex="-1" data-val="'+msg[i].name+'" href="#">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
							}

						}
						if (msg.length > 10) {
							searchResults.append($('<li class="divider"></li><li><em>... and '+(msg.length-10)+' more</em></li>'));
						}
						searchResults.append($('</ul>'));
						searchResults.find('a').click(function(e) {
							e.preventDefault();
							window.log($(this).data('val'));
							searchResults.hide();
							$('#rLine').val(lineString.replace(currentWord,$(this).data('val'))+' ');
							$('#rLine').caret($('#rLine').val().length);
						});
						searchResults.show();
					} else {
						searchResults.hide();
					}
				});
			} else {
				searchResults.hide();
			}

			// server parsing
			if (keycodesToIgnore.indexOf(e.keyCode)===-1) {

				$.getJSON('/rec/parseString/'+fixEncoding(lineString),function(msg){

					//window.log(msg);

					bits = [];

					bits.push(msg.rendering);

					if (msg.valid) {
						bits.push('VALID');
					} else {
						bits.push('INVALID');
					}

					$('#inputFeedback').text(bits.join());

				});
			}

		} else {
			$('#inputFeedback').empty();
		}
	});



});


