
jQuery(document).ready(function() {

	console.log('ready!');

	$('#filteralc').click(function() {
		console.log('will show non-alcoholic');
		$('.nonalc').hide();
		$('.alc').show();
	});
	$('#filternonalc').click(function() {
		console.log('will show alcoholic');
		$('.nonalc').show();
		$('.alc').hide();
	});
	$('#filternone').click(function() {
		console.log('will show all');
		$('.nonalc').show();
		$('.alc').show();
	});
});


// jQuery(window).load(function() { });

