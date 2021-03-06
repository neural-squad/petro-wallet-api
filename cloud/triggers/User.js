Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	var user = request.object;

	if(user.isNew()) {
        user.set("balance", 0);
        response.success(user);
        return;
    }

	if(user.dirty('balance')) {
		let query = new Parse.Query(Parse.User);
		query.get(user.id).then((oldUser) => {
			if (!oldUser) {
				response.success();
				return;
			}
			const value = oldUser.get("balance") - user.get("balance");

			let history = new Parse.Object("History");
			history.set("user", oldUser);
			history.set("value", value);

			history.save().then(() => {
                response.success(oldUser);
            },(error) => {
                response.error(error);
            });
		},(error) => {
			response.error(error);
		});
	} else {
		response.success(user);
	}
});

Parse.Cloud.beforeSave("Session", function (request, response) {
	var session = request.object;
	let query = new Parse.Query("Session");
	query.equalTo("user", session.get("user")).first((s) => {
		if(!s){
			response.success();
			return;
		}

		return s.destroy();
	}).then(() => {
		response.success();
	}, (error) => {
		response.error(error);
	})
});