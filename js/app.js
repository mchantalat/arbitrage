
var app = angular.module('arbitrage',['ui.bootstrap']);

//filtre sur chiffre en euros
app.filter("customCurrency", function (numberFilter){
	function isNumeric(value){
	  return (!isNaN(parseFloat(value)) && isFinite(value));
	}
	return function (inputNumber, currencySymbol, decimalSeparator, thousandsSeparator, decimalDigits) {
		if (isNumeric(inputNumber)){
			// Default values for the optional arguments
			currencySymbol = (typeof currencySymbol === "undefined") ? "€" : currencySymbol;
			decimalSeparator = (typeof decimalSeparator === "undefined") ? "," : decimalSeparator;
			thousandsSeparator = (typeof thousandsSeparator === "undefined") ? " " : thousandsSeparator;
			decimalDigits = (typeof decimalDigits === "undefined" || !isNumeric(decimalDigits)) ? 0 : decimalDigits;
	
			if (decimalDigits < 0) decimalDigits = 0;
	
			// Format the input number through the number filter
			// The resulting number will have "," as a thousands separator
			// and "." as a decimal separator.
			var formattedNumber = numberFilter(inputNumber, decimalDigits);
	
			// Extract the integral and the decimal parts
			var numberParts = formattedNumber.split(".");
	
			// Replace the "," symbol in the integral part
			// with the specified thousands separator.
			numberParts[0] = numberParts[0].split(",").join(thousandsSeparator);
	
			// Compose the final result
			var result = currencySymbol +' '+ numberParts[0];
	
	        if (numberParts.length == 2){
	          result += decimalSeparator + numberParts[1];
	        }
	
	        return result;
	        
		}else{
	        return inputNumber;
		}
	};
});

app.controller('EstimCtrl', function ($scope){
	
	//valeurs par défaut
	$scope.prix = 400000;
	$scope.duree_detention = 20;
	$scope.apport = 30;
	$scope.duree_pret = 20;
	$scope.taux_pret = 2.95;
	$scope.taux_inflation = 1;
	$scope.croissance_prix = 1;
	$scope.taux_rendement = 2;
	$scope.croissance_loyer = 1;
	$scope.frais_notaire =6.5;
	$scope.frais_agence = 5;
	$scope.charge_fonciere = 0.5;
	$scope.charge_copro =0.5;
	$scope.loyer ="";
	
	
	//fonction calculant les Net Present Value du Tableau et le loyer équivalent
	$scope.getNpv = function(){
		var montant_emprunte =(1-$scope.apport/100)*($scope.prix);
		var apport_initial = ($scope.apport/100)*$scope.prix;

		//calcul d'une échéance annuelle fixe composé des intérêts et du remboursement du capital facial
		var echeance = montant_emprunte*($scope.taux_pret/100)*Math.pow((1+$scope.taux_pret/100),$scope.duree_pret)/(Math.pow((1+$scope.taux_pret/100),$scope.duree_pret)-1);
		//fonction remboursement des interets 
		function interet(i){
			var interet = echeance-((echeance-montant_emprunte*$scope.taux_pret/100)*Math.pow((1+$scope.taux_pret/100),(i-1)));
			return interet;
		}
		//fonction remboursement du capital facial
		function capital(i){
			var capital = (echeance-montant_emprunte*$scope.taux_pret/100)*Math.pow((1+$scope.taux_pret/100),(i-1));
			return capital;
		}
		
		//flux actualisé des intérêts remboursés pendant la periode de détention
		var npv_interet = 0;
		for (i = 1; i <= $scope.duree_detention; i++) {
		    npv_interet += (interet(i))/(Math.pow((1+$scope.taux_inflation/100),i));
		}
	    $scope.npv_interet=-npv_interet;
	    
	    //delta revente = montant apporté - flux actualisé du remboursement capital facial + revente appart - remboursement anticipé du restant du le cas échéant
		var npv_remboursement_facial = 0;
		var remboursement_facial = 0;
		for (j = 1; j <= $scope.duree_detention; j++) {
		    npv_remboursement_facial += (capital(i))/(Math.pow((1+$scope.taux_inflation/100),j));
		    remboursement_facial += (capital(i));
		}
		// remboursement anticipe vaut 0 si duree_pret=duree_detention en supposant qu'il n'y a pas de penalités pour remboursement anticipé
		var npv_remboursement_anticipe = (montant_emprunte-remboursement_facial)/Math.pow((1+$scope.taux_inflation/100),$scope.duree_detention);
		var npv_prix_revente = $scope.prix*Math.pow((1+$scope.croissance_prix/100),$scope.duree_detention)/Math.pow((1+$scope.taux_inflation/100),$scope.duree_detention);
	    $scope.npv_prix=-apport_initial-npv_remboursement_facial-npv_remboursement_anticipe+npv_prix_revente;
		
		//les frais d'agence et de notaire se calculent sur le net vendeur
	    $scope.frais_achat = -$scope.prix*(($scope.frais_agence/100)+($scope.frais_notaire/100))/(1+$scope.frais_agence/100);
	    
	    //les charges courantes croient comme l'inflation
	    $scope.frais_courant = -$scope.prix*$scope.duree_detention*($scope.charge_fonciere+$scope.charge_copro)/100;
	    
	    //total achat
	    $scope.delta_achat = $scope.npv_interet+$scope.npv_prix+$scope.frais_achat+$scope.frais_courant;
	    
	    //epargne intiale + interet actualisé
	    var npv_epargne = 0;
		npv_epargne = apport_initial*Math.pow((1+$scope.taux_rendement/100),$scope.duree_detention)/Math.pow((1+$scope.taux_inflation/100),$scope.duree_detention);   
	    $scope.npv_epargne=npv_epargne;
	    
	    //on fixe le flux actualisé de loyer pour matcher achat vs location et on recalcule le loyer équivalent à partir du flux
	    var npv_loyer = 0;
	    var multiple = 0;
    	$scope.npv_loyer= $scope.delta_achat-$scope.npv_epargne;
		for (k = 1; k <= $scope.duree_detention; k++) {
		    multiple += Math.pow((1+$scope.croissance_loyer/100),$scope.duree_detention)/(Math.pow((1+$scope.taux_inflation/100),k));   
		}
		$scope.loyer = -Math.round($scope.npv_loyer/multiple/12);
	    
	    //total location
	    $scope.delta_location = $scope.npv_loyer+$scope.npv_epargne;
	      
	}
	
	//fonction remplissant les scenarios de taux à la place de l'utilisateur
	$scope.getScenario= function(id){
		if(id=="3"){
			$scope.taux_inflation = 1.7;
			$scope.croissance_prix = 7.5;
			$scope.taux_rendement = 3;
			$scope.croissance_loyer = 2.7;	
		}else if (id=="1"){
			$scope.taux_inflation = 0.7;
			$scope.croissance_prix = -1.8;
			$scope.taux_rendement = 1.8;
			$scope.croissance_loyer = 1.1;
		}else if (id=="2"){
			$scope.taux_inflation = 1;
			$scope.croissance_prix = 1;
			$scope.taux_rendement = 2;
			$scope.croissance_loyer = 1;
		}
		//on reactualise les valeurs
		$scope.getNpv();
	}
	
	//initialisation
	$scope.getNpv();

});


