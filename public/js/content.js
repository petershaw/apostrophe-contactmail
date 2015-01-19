function AposContactmail(token, contents){
	$( document ).ready(function() {
		var clienttoken = null;
		
		// Get a client token
		/** This is not secure. it is just a first barrier, a script can still attack this service */
		$.ajax({
			type: "GET"
			, url: "/apos-contactmail/client-token"
			, headers: {
				'x-server-token': token
			}
			, dataType: 'json'
			, success: function(response) {
				clienttoken = response.token;
			}
			, error: function(response) {
				console.log("Error", response );
			}
		});
		
		// Event to send the form
		$('[data-send-contactmail]').on('click', function(event){
			var $form = $('[data-send-contactmail]').closest('form');
			if($form.length > 0){
				var $form = $form[0];
			}
			$.ajax({
				  type: "POST"
				, url: "/apos-contactmail/send"
				, data: $($form).serializeJSON()
				, headers: {
					'x-server-token': token
					, 'x-client-token': clienttoken
				}
				, dataType: 'json'
				, success: function(response) {
				
					if(response.error){
						$($form).html(( contents.error || '<strong>Error</strong> sending email.')+ '<br />'+response.error);
					} else {
						$($form).html((contents.success || '<strong>Thank you</strong>'));
					}
				}
				, error: function(response) {
					if(response.error){
						$($form).html((contents.error || '<strong>Error</strong> sending email.')+ '<br >');
					} else {
						$($form).html(contents.error || '<strong>Unknown error</strong>');
					}
				}
			});			

		});

	});
	
}