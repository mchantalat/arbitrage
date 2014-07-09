
var app = angular.module('arbitrage',['ui.bootstrap']);


app.controller('EstimCtrl', function ($scope){
	$scope.getNpv = function(){
		var montant_emprunte =(1-$scope.apport)*($scope.prix);
		var apport_initial = $scope.apport*$scope.prix;
		// on emprunte le 1er janvier 2010 et on paie le 1er janvier 2011 les premiers interets sur la totalité du montant + la premiere tranche de remboursement
		
		//flux actualisée interet
		var npv_interet = 0;
		for (i = 1; i <= $scope.duree_detention; i++) {
		    npv_interet += (montant_emprunte*($scope.taux_pret)*(1-(i-1)/($scope.duree_pret)))/(Math.pow((1+$scope.taux_inflation),i));   
		}
	    $scope.npv_interet=-npv_interet;
	    
	    //delta revente = montant apporté - flux actualisé du remboursement facial, revente appart et remboursement anticipé du prêt le cas échéant
		var npv_remboursement_facial = 0;
		for (j = 1; j <= $scope.duree_detention; j++) {
		    npv_remboursement_facial += (montant_emprunte/$scope.duree_pret)/(Math.pow((1+$scope.taux_inflation),j));
		}
		// cela vaut 0 si duree_pret=duree_detention en supposant qu'il n'y a pas de penalités pour remboursement anticipé
		var npv_remboursement_anticipe = montant_emprunte*(1-$scope.duree_detention/$scope.duree_pret)/Math.pow((1+$scope.taux_inflation),$scope.duree_detention);
		var npv_prix_revente = $scope.prix*Math.pow((1+$scope.croissance_prix),$scope.duree_detention)/Math.pow((1+$scope.taux_inflation),$scope.duree_detention);
	    $scope.npv_prix=-apport_initial-npv_remboursement_facial-npv_remboursement_anticipe+npv_prix_revente;
		
		//fees achat
	    $scope.frais_achat = -$scope.prix*($scope.frais_agence+$scope.frais_notaire);
	    
	    //charges courantes
	    $scope.frais_courant = -$scope.prix*($scope.charge_fonciere+$scope.charge_copro);
	    
	    //total achat
	    $scope.delta_achat = $scope.npv_interet+$scope.npv_prix+$scope.frais_achat+$scope.frais_courant;
	    
	    
	    //flux actualisée loyer
	    var npv_loyer = 0;
		for (k = 1; k <= $scope.duree_detention; k++) {
		    npv_loyer += $scope.loyer*Math.pow((1+$scope.croissance_loyer),$scope.duree_detention)/(Math.pow((1+$scope.taux_inflation),k));   
		}
	    $scope.npv_loyer=-npv_loyer;
	    
	    //epargne + interet actualisé
	    var npv_epargne = 0;
		npv_epargne = apport_initial*Math.pow((1+$scope.taux_rendement),$scope.duree_detention)/Math.pow((1+$scope.taux_inflation),$scope.duree_detention);   
	    $scope.npv_epargne=npv_epargne;
	    
	    
	    //total achat
	    $scope.delta_location = $scope.npv_loyer+$scope.npv_epargne;

	}

});

