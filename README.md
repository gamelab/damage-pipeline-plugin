Damage Pipeline Plugin
======================

	Version: 1.0.0
	Type: Gameplay Aid
	Author: Benjamin D. Richards for Kiwi.js Team
	Website: www.kiwijs.org
	Kiwi.js Version Last Tested: 1.1.1

# Description

The Damage Pipeline is an advanced damage processing system for your [KiwiJS](http://www.kiwijs.org) games. It allows you to create composite damage packs and process them through a node-based pipeline.

In fact, this system could be used for any configurable processing pipeline. Perhaps it could be used to calculate excise and spoilage on the income of a railway freight company operating in multiple countries. Any kind of process that involves performing operations on numbers in configurable ways can benefit from this plugin.

Check out the [easy introductory tutorial](http://www.kiwijs.org/documentation/tutorials/damage-pipeline-plugin-tutorial/) on our website, or read on for the real nitty-gritty.

# Table of Contents
* Description
* Table of Contents
* Versions
* Files/Folders
* How to use
	- Setup
	- Pipeline Objects
		+ Packs
		+ Pipeline Nodes
		+ Meter Nodes
	- Example
	- Advanced Use Guide
		+ Pipeline Node - Advanced
			* Per-Node Flow
				- Receive
				- Process
				- Operate
				- onExhaust
				- Dispatch
			* Customising Node Process
				- defaultChildIndex
				- doDefaultDispatch
				- processOnReceive
				- processTopDown
		+ Meter Node - Advanced
			* Accessing Meter Checks
				- Meter Check Method
				- Meter Check Signal
				- Method or Signal?
			* Types of Check
				- Receive
				- Max
				- Overflow
				- Zero
				- Break
* Thank You

# Versions

1.0.0
* Initial release

# Files/Folders

	build/			- Compiled version of the plugin files
	docs/			- API documentation generated by yuidocs
	examples/		- Examples of the plugin in action
	src/			- Source files used to create the plugin
	README.md		- This readme file.
	.gitignore		- Git ignore prevents upload of working files
	gruntfile.js	- Grunt tasks used to build plugin
	package.json	- Package data for Grunt

# How to use

## Setup

Acquire the plugin from the [GameLab GitHub page](https://github.com/gamelab).

Copy the plugin file (either `build/damage-pipeline-x.x.x.js` or `build/damage-pipeline-x.x.x.min.js`) into your project folder. We recommend you create a `js/plugins/` folder to reduce confusion in large projects, but this is purely optional.

Load the plugin script directly after the KiwiJS library.

```html
<script src="js/lib/kiwi.js"></script>
<script src="js/plugins/damage-pipeline-x.x.x.js"></script>
```

Add the plugin to your KiwiJS game's plugins options:

```javascript
var gameOptions = {
	plugins: [ "DamagePipeline" ]
};
var game = new Kiwi.Game( null, "game", null, gameOptions );
```

Now you are ready to begin using Damage Pipelines in your game.

## Pipeline Objects

There are three main pipeline objects: **Packs**, **Pipeline Nodes**, and **Meter Nodes**. See the API reference for a complete list of available commands. This readme will introduce you to the possibilities of the pipeline.

### Packs

A Pack represents a single attack or type of damage. It has a **value**, **tags**, **mode**, and **subPacks**.

**Value** is simply how strong the Pack is. A Pack with value 10 will take off 10 points of health.

**Tags** allow the pipeline to filter Packs. A pipeline node will only operate on a Pack which shares at least one tag. (It can have different tags so long as at least one tag matches.) For example, a Pack tagged with "FIRE" will be processed by a fire resistance node, but it will pass through an ice resistance node unharmed.

**Mode** dictates what effect the Pack has on meters. It can have the following values:
* "SUBTRACT" will take points off the meter. This is the **default**.
* "ADD" will add points to the meter. This is useful for healing effects or meters that naturally begin at zero.
* "SET" will set the meter value to the Pack value. This is useful for attacks with a fixed effect, such as a stun effect that lasts for 1.5 seconds.

**SubPacks** are additional Packs that piggy-back on this one. They represent secondary effects that rely on the parent Pack to carry them through defences. For example, consider an assassin's poisoned dagger. If it pierces the skin, it delivers a debilitating toxin. But if it doesn't draw blood, the poison has no effect. We might represent this as a Pack with value 5, the tag "PHYSICAL", and a subPack with value 50 and the tag "POISON". If the parent Pack is prevented by armour, it cannot carry its subPack any further and the victim is safe... for now.

To create a Pack, use the following syntax:

```javascript
var pack = new Kiwi.Plugins.DamagePipeline.Pack( {
	value: 10
});

// All optional parameters:
var packPhysical = new Kiwi.Plugins.DamagePipeline.Pack( {
	value: 5,
	tags: "PHYSICAL",
	owner: fighter1,
	mode: "SUBTRACT"
	subPacks: pack
});

// Or to declare multiple tags and subPacks:
var packPoison = new Kiwi.Plugins.DamagePipeline.Pack( {
	value: 50,
	tags: [ "POISON", "MINERAL" ],
	owner: fighter2,
	mode: Kiwi.Plugins.DamagePipeline.Pack.prototype.SUBTRACT,
	subPacks: [ pack, packPhysical ]
});
```

Note that `"SUBTRACT"` and `Kiwi.Plugins.DamagePipeline.Pack.prototype.SUBTRACT` resolve to the same value behind the scenes. The string is simply more succinct.

You must declare Packs in bottom-up order, so you have children ready to pass to their parents. If you wish to add Packs in any order, you may access `pack.subPacks` as an array.

### Pipeline Nodes

A pipeline node is a processing unit. It can do just about anything, but for simplicity's sake, think of it as performing a single task in a sequence. It has two key properties: **name** and **tags**.

**Name** is a unique identifier. This is used in some pipeline operations when the node must decide what child to receive a Pack.

**Tags** allow the pipeline to filter Packs. A pipeline node will only operate on a Pack which shares at least one tag.

Create a node as follows:

```javascript
var node1 = new Kiwi.Plugins.DamagePipeline.PipelineNode( {} );

// With common parameters:
var node2 = new Kiwi.Plugins.DamagePipeline.PipelineNode( {
	name: "Physical Armor",
	tags: "PHYSICAL",
	operation: function( pack ) {
		pack.value -= 10;
	}
} );

// With complete parameters
var node3 = new Kiwi.Plugins.DamagePipeline.PipelineNode( {
	name: "Physical Armor",
	tags: [ "PHYSICAL", "SILVER" ],
	operation: function( pack ) {
		pack.value -= 10;
	},
	children: [ node1, node2 ],
	defaultChildIndex: 0,
	doDefaultDispatch: true,
	processOnReceive: true,
	processTopDown: false
} );
```

Connect a node as follows:

```javascript
node1.addChild( node2 );
```

### Meter Nodes

A meter node is a pipeline node with a persistent value of its own. Think of it as the node that stores hit points or health. You can actually use it for many other purposes, including temporary stun or invulnerability conditions, different body parts, etc.

A meter node has two important properties in addition to those possessed by all pipeline nodes: **value** and **valueMax**.

**Value** is a simple number, usually representing health remaining. Packs are applied to this value when they reach the meter node. It is limited to the range from 0 to valueMax, inclusive. By default it begins equal to valueMax.

**ValueMax** is the maximum value that value may hold. It is also the default value. ValueMax defaults to 100.

Create a meter node as follows:

```javascript
var healthMeter = new Kiwi.Plugins.DamagePipeline.MeterNode( {} );

// With common parameters
var hpMeter = new Kiwi.Plugins.DamagePipeline.MeterNode( {
	name: "Hit Point Meter",
	tags: "PHYSICAL",
	value: 100,
	valueMax: 100
});

// With complete parameters
var stunMeter = new Kiwi.Plugins.DamagePipeline.MeterNode( {
	name: "Stun Meter",
	tags: [ "STUN", "STAGGER" ],
	value: 0,
	valueMax: 100,
	doOnReceive: function( pack ) {
		Kiwi.Plugins.DamagePipeline.MeterNode.prototype.doOnReceive.call ( this, pack );
		console.log( "Received pack" );
	},
	doOnMax: function( pack ) {
		console.log( "Meter reached max" );
	},
	doOnOverflow: function( pack ) {
		console.log( "Meter exceeded max" );
	},
	doOnBreak: function( pack ) {
		console.log( "Meter dropped below 0" );
	},
	doOnZero: function( pack ) {
		console.log( "Meter reached 0" );
	},
	children: [ node1, node2 ],
	defaultChildIndex: 0,
	doDefaultDispatch: true,
	processOnReceive: true
});
```

The meter node extends the pipeline node. It acts in precisely the same way, with the exception that you cannot set the `operation` parameter. The meter node will perform its basic function without further configuration.

Packs will affect the value of a meter node until they are exhausted or the node value reaches its limits (0 or `valueMax`).

## Example

There is a working example in the `examples/` folder. Have a look and see what you can do with just a few nodes and packs!

Note that the methods attached to the meter nodes serve no purpose other than to update the GUI. You could manage this from outside the pipeline, but we have chosen to demonstrate a lot of the meter node functionality.

## Advanced Use Guide

It's easy to get a functional damage system with the Damage Pipeline Plugin. Create damage packs, send them to a pipeline node, and attach a health meter node.

But to get the most out of the pipeline, you need to know a bit more about the way it works. Let's have a look under the hood.

### Pipeline Node - Advanced

#### Per-Node Flow

Pipeline nodes follow a strict sequence from beginning to end. By default, it looks like this:

* **Receive** Pack
* **Process** Pack
	- Unpack Pack, bottom-first
	- For each unpacked Pack:
		+ Check tags
		+ **Operate** on Pack
		+ Check **onExhaust**
	- **Dispatch** Pack

Let's go over this logic.

##### Receive

The node begins its process when a Pack arrives. This is triggered as follows:

```javascript
node.receive( pack );
```

The Pack is added to an internal array.

##### Process

The node process begins automatically when it receives a Pack. The node unpacks every Pack and arranges it bottom-first, so that the children are processed first and the parent last.

Order is important. If the parent were processed first, it might be sent on or discarded without ever processing its children. We process bottom-first to prevent such accidents.

The subPack queue is processed one by one using the node operation.

If the node has **tags**, it will only perform the node operation on Packs which share at least one tag. If it does not have tags, it will operate on all Packs.

##### Operate

Each subpack is passed through a method called the node operation. It is defined by the `operation` parameter when creating the node.

The operation should modify the Pack in some way. For example, most operations will modify the Pack value:

```javascript
// Reduce damage via armor
operation = function( pack ) {
	pack.value -= 10;
}

// Increase damage due to vulnerability
operation = function( pack ) {
	pack.value *= 2;
}
```

It is also possible to send the pack to another node with the `dispatch` method. This is useful for splitting different types of Pack onto different paths; for example, a Stun effect shouldn't hit the Health meter. Note that a dispatched pack is extracted from its parent. It will not go to default dispatch later in the process.

```javascript
// Send pack to another node
operation = function( pack ) {
	this.dispatch( pack, node );
}

// It is recommended that you attach all destination nodes as children.
operation = function( pack ) {
	this.dispatch( pack, this.getChildByName("Destination Node") );
}
```

##### onExhaust

If a Pack has been reduced to 0 value, it is now considered **exhausted**. It will be discarded from the pipeline, along with all its children.

When this happens, a node will trigger a `Kiwi.Signal` called `onExhaust`. This usually happens when a protective node has nullified damage. It might be a good time to play an armor sound effect or display a "block" animation.

Add functions to the onExhaust signal like this:

```javascript
nodePhysicalArmor.onExhaust.add( function() {
	console.log( "The armour worked!" );
} );
```

##### Dispatch

Once a Pack has been processed, it is sent to dispatch. By default, this sends the Pack to the first child of this node. The dispatch target will `receive` the Pack, and the cycle starts over.

Dispatch will detect exhausted nodes and discard them.

If this node doesn't have any children, the Pack will be removed from this node. It has reached the end of the line and is effectively discarded.

If the node can find a valid target, and the Pack is not exhausted, the node activates a `Kiwi.Signal` called `onDispatch`, with the parameters `this` and `pack` (referring to the current node and the Pack in question). This may be most useful for diagnostic purposes, such as tracing a Pack's status through a complex pipeline.

#### Customising Node Process

Now that we know how the pipeline node works by default, we may change its behaviour. Important parameters include `defaultChildIndex`, `doDefaultDispatch`, `processOnReceive`, and `processTopDown`.

##### defaultChildIndex

This parameter allows you to specify the default child. This is normally 0, the first child added to the node. If you wish to change this to another node, you may specify its index here.

This parameter requires that you know the order in which you added children.

##### doDefaultDispatch

By default, any Pack that is not sent elsewhere will be sent to the default child. Set this parameter to `false` if you do not want this to happen.

Be aware that a Pack which is not dispatched will remain with the node. It will be automatically processed again when the node receives another Pack, and might not be discarded even after it is exhausted. This might eventually cause slowdown. If you prevent default dispatch, you should take particular care to ensure that you know where all your Packs are going.

##### processOnReceive

By default, a Pack is processed as part of the `receive` method. This allows damage to resolve as quickly as possible.

Sometimes it may prove useful to queue up Packs and process them in a more leisurely fashion. For example, if you want to deliver damage over time rather than all at once, you will want to control your pipeline node from the update loop.

To prevent automatic processing, set `processOnReceive` to `false`. This will prevent the process method from firing automatically.

In this mode, you will have to initiate the process yourself. Do so with `PipelineNode.process()`. This method takes no arguments and will process all current Packs on the node in order of receipt.

##### processTopDown

By default, the pipeline processes each Pack bottom-up. This ensures that we will process every subPack, even if its parent is later exhausted and discarded.

In some cases you may wish to process top-down instead. For example, if you want to catch the top-most case of a given tag and dispatch it, you cannot start from the bottom. If you do, you have no way of knowing whether that tag is really top-most.

In this case, you can reverse the order of a pipeline node. Set `processTopDown` to `true`.

### Meter Node - Advanced

The meter node extends the pipeline node, and has all the same functionality. The sole exception is the `operation` parameter, which is disabled.

In addition, the meter node has five key checks which you may customise: **receive**, **max**, **overflow**, **zero**, and **break**. These share the same style of access via method and/or signal, described below.

#### Accessing Meter Checks

Each meter check runs a method and sends a signal.

##### Meter Check Methods

When a check succeeds, it runs a method.

You may set these as parameters when creating the meter node. Meter check methods are passed a Pack as their sole argument, and are empty by default (with the **exception** of `doOnReceive`, which has a default method already set). For example:

```javascript
var meter = new Kiwi.Plugins.DamagePipeline.MeterNode( {
	doOnZero: function( pack ) {
		console.log ( "I'm dead!" );
	}
});
```

##### Meter Check Signals

When a check succeeds, directly after it runs the dedicated method, it activates a `Kiwi.Signal` object. You do not have to create this. You may add callbacks to the Signal as normal. For example:

```javascript
meter.onMax.add( function() {
	console.log( "I'm totally fine!" );
});
```

##### Method or Signal?

We provide two ways to access meter node checks. Which one is best for you?

We recommend that you use a method if the pipeline will not change over its lifetime. This keeps its functions all in one place.

Use a signal if you need the pipeline to do something outside its normal functionality, or if you need to keep the logic encapsulated elsewhere.

#### Types of Check

The checks are performed in order: receive, max, overflow, zero, and break.

##### Receive

```javascript
MeterNode.doOnReceive( pack );
MeterNode.onMax;
```

This check always activates. It is checked at the beginning of the per-Pack operation.

**Caution**: This check has default behaviour. It is responsible for applying Packs to the value of this meter node. If you override `doOnReceive`, and want to retain default behaviour, you should do so in the following way:

```javascript
var meter = new Kiwi.Plugins.DamagePipeline.MeterNode( {
	doOnReceive: function( pack ) {
		Kiwi.Plugins.DamagePipeline.MeterNode.prototype.doOnReceive.call ( this, pack );

		console.log( "Received Pack" );
	}
});
```

##### Max

```javascript
MeterNode.doOnMax( pack );
MeterNode.onMax;
```

This check activates if the meter has just reached maximum. It does not activate if it is already at maximum.

This is a good place to trigger "Health Restored" messages, finish a charge-up sequence, or perform other one-off events.

##### Overflow

```javascript
MeterNode.doOnOverflow( pack );
MeterNode.onOverflow;
```

This check activates if the meter is being increased beyond maximum. It requires that the Pack `mode` be set to `ADD`, and that the Pack have value left after reaching maximum.

This is a good place to perform secondary effects. For example, a healing effect that overflows might be dispatched to a temporary health meter that drains over time.

##### Zero

```javascript
MeterNode.doOnZero( pack );
MeterNode.onZero;
```

This check activates if the meter has just dropped to 0. It does not activate if it is already at zero.

This is a good place to trigger KO or death effects.

##### Break

```javascript
MeterNode.doOnBreak( pack );
MeterNode.onBreak;
```

This check activates if the meter is being reduced below 0. It requires that the Pack `mode` be set to `SUBTRACT`, and that the Pack have value left after reaching 0.

This is a good place to pass damage on to a fresh meter. For example, if you have a meter that represents a starship's force shield, use break to send additional damage to the unprotected hull.

# Thank You

We hope you enjoy the Damage Pipeline Plugin. If you have any questions or issues, we welcome your input on the [KiwiJS website](http://www.kiwijs.org).
