window.log=function(){log.history=log.history||[];log.history.push(arguments);this.console&&console.log(Array.prototype.slice.call(arguments))};var searchPrompt="Search by ingredient name...";jQuery(document).ready(function(){$("#searchField").val(searchPrompt).addClass("empty");$("#searchField").focus(function(){$(this).val()===searchPrompt&&$(this).val("").removeClass("empty")});$("#searchField").blur(function(){$(this).val()===""&&$(this).val(searchPrompt).addClass("empty")});$("#searchField").keyup(function(){var e=$("#searchField").val(),t=$("#searchResults");e.length>0?$("#resetsearch").css("opacity","1.0"):$("#resetsearch").css("opacity","0.5");e.length>1?$.getJSON("/search/ing/"+e,function(n){t.empty();if(n.length>0){t.append($("<ul>"));for(var r=0;r<10;r++)r<n.length&&t.append($('<li><a tabindex="-1" href="/i/'+n[r].iid+'.html">'+n[r].name+" ("+n[r].context+")</a></li>"));n.length>10&&t.append($('<li class="divider"></li><li><a tabindex="-1" href="/index.html?q='+encodeURIComponent(e)+'"><em>... and '+(n.length-10)+" more</em></a></li>"));t.append($("</ul>"));t.show()}else if(e.length>0){t.append($("<li><em>No matches. Try searching on the first few letters of a product or category.</em></li>"));t.show()}else t.hide()}):t.hide()});$("body").click(function(e){$(e.target).is("#searchResults")||$("#searchResults").hide()});$("#resetsearch").click(function(){$("#searchResults").hide();$("#searchField").val("");$("#resetsearch").css("opacity","0.5")});$("#pIngredient").val(searchPrompt).addClass("empty");$("#pIngredient").focus(function(){$(this).val()===searchPrompt&&$(this).val("").removeClass("empty")});$("#pIngredient").blur(function(){$(this).val()===""&&$(this).val(searchPrompt).addClass("empty")});$("#pIngredient").keyup(function(){var e=$("#pIngredient").val(),t=$("#pIngredientMatches"),n;e.length>1?$.getJSON("/search/product/"+e,function(e){t.empty();if(e.length>0){t.append($("<ul>"));for(var r=0;r<e.length;r++){n=$('<li><a href="#" tabindex="-1" data-name="'+e[r].name+'" data-iid="'+e[r].iid+'">'+e[r].name+" ("+e[r].context+")</a></li>");t.append(n)}t.append($("</ul>"));t.show();$("#pIngredientMatches li a").click(function(){$("#pIngredientIID").val($(this).data("iid"));$("#pIngredient").val("");$("#pIngredientDisplay").val($(this).data("name"));t.empty().hide()})}else{t.append($("<p><em>No matches. Try searching on the first few letters of a product or category.</em></p>"));t.show()}}):t.empty().hide()});$("#pRegionSearch").keyup(function(){var e=$("#pRegionSearch").val(),t=$("#pRegionMatches"),n;e.length>1?$.getJSON("/search/region/"+e,function(e){t.empty();if(e.length>0){t.append($("<ul>"));for(var r=0;r<e.length;r++){e[r][1].length>0?n=$('<li><a href="#" tab-index="-1" data-region="'+e[r][0]+'" data-iso="'+e[r][2]+'" data-currency="'+e[r][3]+'">'+e[r][0]+" ("+e[r][1]+")</a></li>"):n=$('<li><a href="#" tab-index="-1" data-region="'+e[r][0]+'" data-iso="'+e[r][2]+'" data-currency="'+e[r][3]+'">'+e[r][0]+"</a></li>");t.append(n)}t.append($("</ul>"));t.show();$("#pRegionMatches li a").click(function(){$("#pRegion").val($(this).data("region"));$("#pCurrencyDisplay").val($(this).data("currency")+" ("+$(this).data("iso")+")");$("#pCurrency").val($(this).data("iso"));$("#pRegionSearch").val("");t.empty().hide()})}else{t.append($("<p><em>No matches. Try searching on the first few letters of a country or state.</em></p>"));t.show()}}):t.empty().hide()});$("#pSubmit").click(function(){var e={iid:$("#pIngredientIID").val(),type:$("input:radio[name=ptype]:checked").val(),price:$("#pPrice").val(),currency:$("#pCurrency").val(),volume:$("#pVol").val(),units:$("#pUnits").val(),region:$("#pRegion").val(),timestamp:(new Date).getTime()/1e3},t=JSON.stringify({prices:[e]});window.log(t);jQuery.ajax({type:"POST",url:"/search/submitprice",data:t,contentType:"application/json; charset=utf-8"});$("#pIngredientIID").val("");$("#pPrice").val("");$("#pIngredientDisplay").val("")})});