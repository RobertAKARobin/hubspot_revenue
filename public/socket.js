var Socket = (function(){
	
	var $Class = {};
	var $Instance = {};
	var $InstanceConstructor;

	$Class.new = function(){
		var instance = Object.create($Instance);
		$InstanceConstructor.apply(instance, arguments);
		return instance;
	}

	$InstanceConstructor = function(){
		var socket = this;
	}
	$Instance.send = function(url){
		var socket = this;
		socket.hasErrors = false;
		socket.url = url;
		socket.eventSource = new EventSource(url);
		socket.eventSource.onmessage = socket.handleMessage.bind(socket);
		socket.eventSource.onerror = socket.handleError.bind(socket);
		if(socket.onstart){
			socket.onstart();
		}
	}
	$Instance.handleMessage = function(response){
		var socket = this;
		if(response.data == 'CLOSE'){
			socket.close();
		}else{
			try{
				var formatted = JSON.parse(response.data);
				if(!formatted.success) throw formatted;
			}catch(error){
				socket.handleError(error);
				return;
			}
			if(socket.onmessage){
				socket.onmessage(formatted);
			}
		}
	}
	$Instance.handleError = function(error){
		var socket = this;
		socket.hasErrors = true;
		if(socket.onerror){
			socket.onerror(error);
		}
		socket.close();
	}
	$Instance.close = function(){
		var socket = this;
		socket.eventSource.close();
		if(socket.onclose){
			socket.onclose();
		}
	}

	return $Class;

})();