YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Kiwi.Plugins.DamagePipeline",
        "Kiwi.Plugins.DamagePipeline.MeterNode",
        "Kiwi.Plugins.DamagePipeline.Pack",
        "Kiwi.Plugins.DamagePipeline.PipelineNode"
    ],
    "modules": [
        "Kiwi",
        "Kiwi.Plugins",
        "MeterNode",
        "Pack",
        "PipelineNode",
        "Plugins"
    ],
    "allModules": [
        {
            "displayName": "Kiwi",
            "name": "Kiwi"
        },
        {
            "displayName": "Kiwi.Plugins",
            "name": "Kiwi.Plugins"
        },
        {
            "displayName": "MeterNode",
            "name": "MeterNode",
            "description": "Meter Node, a pipeline object that extends the standard\n\tPipeline Node with a meter.\n<br><br>\nThe Meter Node has several built-in functions.\n\tEach receives a Pack as its argument.\n\tYou can override these to perform custom functionality.\n\t<ul>\n\t<li><code>doOnReceive</code>: called when the node receives a Pack.\n\tDefault behaviour: Apply Pack to meter</li>\n\t<li><code>doOnZero</code>: called when the node drops to 0.\n\tDefault behaviour: None</li>\n\t<li><code>doOnMax</code>: called when the node rises to maximum.\n\tDefault behaviour: None</li>\n\t<li><code>doOnBreak</code>: called when the node drops below 0.\n\tDefault behaviour: None</li>\n\t<li><code>doOnOverflow</code>: called when the node rises above maximum.\n\tDefault behaviour: None</li>\n\t</ul>\n<br><br>\nThe Pipeline Node inherits all functionality of the Pipeline Node,\n\tbut it implements a custom version of the <code>_operation</code> method.\n\tYou should override the above functions instead.\n\tAs an extension of PipelineNode, the MeterNode will automatically\n\tprocess all packs and subpacks in bottom-up order. You do not need to\n\twrite methods to deal with subpacks."
        },
        {
            "displayName": "Pack",
            "name": "Pack",
            "description": "Damage Pack, a message containing information about incoming damage."
        },
        {
            "displayName": "PipelineNode",
            "name": "PipelineNode",
            "description": "Pipeline Node, a pipeline object that processes Pack objects.\n\t<br><br>\n\tA PipelineNode receives Packs, performs some operation on them, and then\n\tnormally passes them on to one or another of its children.\n\tTypically if a Pack becomes exhausted it is simply removed and\n\tno children are called. The PipelineNode has no knowledge of stack;\n\tit can only direct dispatches to its children and expects no response.\n\t<br><br>\n\tYou may customise this node extensively just using the params object.\n\tAdd children of type PipelineNode or MeterNode, then define\n\tan operation function that processes Packs and forwards them\n\tto children using \"getChildByName\".\n\t<br><br>\n\tTo create nodes with your own functionality, use the\n\t<code>Kiwi.extend</code> method, and overwrite the\n\t<code>_operate</code> function with your own custom code.\n\t<br><br>\n\n\t\t// Extend this code only if normal customisation is insufficient\n\t\tvar MyNode = function( params ) {\n\t\t\n\t\t\t// Super\n\t\t\tKiwi.Plugins.DamagePipeline.PipelineNode.call( this, params );\n\t\t\n\t\t\t// Your constructor code goes here\n\t\t};\n\t\tKiwi.extend( MyNode, Kiwi.Plugins.DamagePipeline.PipelineNode );\n\t\t\n\t\tMyNode.prototype._operate = function( pack ) {\n\t\t\t// Your operation goes here\n\t\t};"
        },
        {
            "displayName": "Plugins",
            "name": "Plugins",
            "description": "Damage Pipeline encompasses methods to perform advanced damage processing."
        }
    ]
} };
});