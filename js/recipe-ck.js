function fixEncoding(e){e=e.replace("/","@");return e}(function(e){e.fn.caret=function(e){var t=this[0];if(arguments.length==0){if(window.getSelection){if(t.contentEditable=="true"){t.focus();var n=window.getSelection().getRangeAt(0),r=n.cloneRange();r.selectNodeContents(t);r.setEnd(n.endContainer,n.endOffset);return r.toString().length}return t.selectionStart}if(document.selection){t.focus();if(t.contentEditable=="true"){var n=document.selection.createRange(),r=document.body.createTextRange();r.moveToElementText(t);r.setEndPoint("EndToEnd",n);return r.text.length}var e=0,i=t.createTextRange(),r=document.selection.createRange().duplicate(),s=r.getBookmark();i.moveToBookmark(s);while(i.moveStart("character",-1)!==0)e++;return e}return 0}if(window.getSelection)if(t.contentEditable=="true"){t.focus();window.getSelection().collapse(t.firstChild,e)}else t.setSelectionRange(e,e);else if(document.body.createTextRange){var i=document.body.createTextRange();i.moveToElementText(t);i.moveStart("character",e);i.collapse(!0);i.select()}}})(jQuery);window.log=function(){log.history=log.history||[];log.history.push(arguments);this.console&&console.log(Array.prototype.slice.call(arguments))};var keycodesToIgnore=[37,38,39,40];jQuery(document).ready(function(){$("#rLine").keyup(function(e){var t=$("#rLine").val(),n=$("#rKeywordMatches"),r,i,s;if(t.length>1){var o=$("#rLine").caret();if(o){s=t.lastIndexOf(" ",o);i=t.slice(s+1,o)}else i="";i.length>2?$.getJSON("/search/ing/"+fixEncoding(i),function(e){n.empty();if(e.length>0){n.append($("<ul>"));for(var r=0;r<10;r++)r<e.length&&n.append($('<li><a tabindex="-1" data-val="'+e[r].name+'" href="#">'+e[r].name+" ("+e[r].context+")</a></li>"));e.length>10&&n.append($('<li class="divider"></li><li><em>... and '+(e.length-10)+" more</em></li>"));n.append($("</ul>"));n.find("a").click(function(e){e.preventDefault();window.log($(this).data("val"));n.hide();$("#rLine").val(t.replace(i,$(this).data("val"))+" ");$("#rLine").caret($("#rLine").val().length)});n.show()}else n.hide()}):n.hide();keycodesToIgnore.indexOf(e.keyCode)===-1&&$.getJSON("/rec/parseString/"+fixEncoding(t),function(e){r=[];r.push(e.rendering);e.valid?r.push("VALID"):r.push("INVALID");$("#inputFeedback").text(r.join())})}else $("#inputFeedback").empty()})});