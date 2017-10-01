'use strict';

class Balance {
    constructor(request, response){
        this.request = request;
        this.response = response;
        this.currentUser = request.user;
    }

    transfer() {
        if(!this.currentUser){
            this.response.error({message: "Tem que estar logado..."});
            return;
        }

        const cpf = this.request.params.cpf;
        const value = this.request.params.value;
        const sbalance = this.currentUser.get("balance") || 0;

        if(cpf === undefined || value === undefined || value > sbalance){
            this.response.error({message: "Parametros invalidos..."});
            return;
        }

        let query = new Parse.Query(Parse.User);
        query.equalTo("username", cpf);
        query.first().then((user) => {
            user.increment("balance", parseFloat(value));
            return user.save(null, {useMasterKey:true});
        }).then((user) => {
            return this.currentUser.fetch();
        }).then((user) => {
            user.increment("balance", parseFloat((-1)*value));
            return user.save(null, {useMasterKey:true});
        }).then((user) => {
            this.response.success(user);
        }, (error) => {
            this.response.error(error);
        })
    }

    pay() {
        if(!this.currentUser){
            this.response.error({message: "Tem que estar logado..."});
            return;
        }

        const cpf = this.request.params.cpf;
        const purchase = this.request.params.purchase;
        const sbalance = this.currentUser.get("balance") || 0;

        if (cpf === undefined || purchase === undefined) {
            this.response.error({message: "Parâmetros inválidos!"});
            return;
        }

        const value = sbalance - purchase;
        if(value < 0){
            this.response.error({message: "Não há saldo suficiente!"});
            return;
        }

        let query = new Parse.Query(Parse.User);
        query.equalTo("username", cpf);

        try {
            query.first()
                .then((user) => {
                    user.set("balance", value);
                    return user.save();
                })
                .then((user) => {
                    this.response.success(user);
                }, (error) => {
                    this.response.error(error);
                })
        } catch (Error) {
            this.response.error({message: "Não foi possível realizar operação!"});
            return;
        }
    }
}

Parse.Cloud.define('transferBalance', (req, res) => {
    new Balance(req, res).transfer();
});

Parse.Cloud.define('pay', (req, res) => {
    new Balance(req, res).pay();
});