// @codekit-prepend "jquery.cookie.js";

function showAlphaReport () {
	$('#alphabeticalReport').show();
	$('#groupedReport').hide();
	$.cookie('reportmode', 'alpha', { expires: 30, path: '/' });
}

function showGroupedReport() {
	$('#alphabeticalReport').hide();
	$('#groupedReport').show();
	$.cookie('reportmode', 'grouped', { expires: 30, path: '/' });
}

function filterAlc() {
	$('.nonalc').hide();
	$('.alc').show();
	$.cookie('filtermode', 'alc', { expires: 30, path: '/' });
}

function filterNonalc() {
	$('.nonalc').show();
	$('.alc').hide();
	$.cookie('filtermode', 'nonalc', { expires: 30, path: '/' });
}

function filterAll() {
	$('.nonalc').show();
	$('.alc').show();
	$.cookie('filtermode', 'all', { expires: 30, path: '/' });
}

jQuery(document).ready(function() {

	console.log($.cookie());

	$('#showAlphaReport').click(showAlphaReport);
	$('#showGroupedReport').click(showGroupedReport);

	$('#filteralc').click(filterAlc);
	$('#filternonalc').click(filterNonalc);
	$('#filternone').click(filterAll);


	var c = $.cookie().reportmode;
	if (c === 'alpha') {$('#showAlphaReport').click();}
	if (c === 'grouped') {$('#showGroupedReport').click();}

	c = $.cookie().filtermode;
	if (c === 'alc') {$('#filteralc').click();}
	if (c === 'nonalc') {$('#filternonalc').click();}
	if (c === 'all') {$('#filternone').click();}


});


// jQuery(window).load(function() { });

