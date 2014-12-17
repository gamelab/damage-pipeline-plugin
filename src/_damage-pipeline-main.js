/**
* Damage Pipeline encompasses methods to perform advanced damage processing.
*
* @module Kiwi
* @submodule Plugins
* @namespace Kiwi.Plugins
* @class DamagePipeline
*/
Kiwi.Plugins.DamagePipeline = {

	/**
	* The name of this plugin.
	* @property name
	* @type String
	* @public
	*/
	name:"DamagePipeline",

	/**
	* The version of this plugin.
	* @property version
	* @type String
	* @public
	*/
	version:"1.0.0",

	/**
	* Minimum version of Kiwi.js library
	* @property minimumKiwiVersion
	* @type String
	* @public
	*/
	minimumKiwiVersion: "1.1.0",

};

/**
* Registers this plugin with the Global Kiwi Plugins Manager if it is available.
*/
Kiwi.PluginManager.register( Kiwi.Plugins.DamagePipeline );

/**
* This create method is executed when Kiwi Game that has been told
* to use this plugin reaches the boot stage of the game loop.
* @method create
* @param game{Kiwi.Game} The game that is current in the boot stage.
* @private 
*/
Kiwi.Plugins.DamagePipeline.create = function( game ) {};
