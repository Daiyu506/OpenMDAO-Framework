
var openmdao = (typeof openmdao === "undefined" || !openmdao ) ? {} : openmdao ;

openmdao.DragAndDropManager=function() {

    /***********************************************************************
     *  deals with the problem that jQuery does not really handle layered
     *   divs with different zindex
     ***********************************************************************/

    var self = this,
        droppables= new Hashtable();

    this.drop_target = null;

    // get top div that contains the draggable, is visible and accepts the
    // type of the draggable
    this.getTopDroppableForDropEvent = function(ev, ui) {
        return openmdao.drag_and_drop_manager.drop_target;
    };

    // gets called when the cursor goes outside the passed in parameter element, droppable
    // the input should be a jQuery object
    this.draggableOut = function(droppable) {
        droppables.remove(droppable[0].id);
        openmdao.drag_and_drop_manager.updateHighlighting();
    };

    // gets called when the cursor goes inside the passed in parameter element, droppable
    // the input should be a jQuery object
    this.draggableOver = function(droppable) {
        var elm_calculated_zindex = this.computeCalculatedZindex(droppable);
        droppables.put(droppable[0].id, elm_calculated_zindex);
        openmdao.drag_and_drop_manager.updateHighlighting();
    };

    // clear all droppables
    this.clearHighlightingDroppables = function() {
        droppables.each( function(id, zindex) {
            var div_object = jQuery('#'+id),
                o = div_object.data('corresponding_openmdao_object');
            o.unhighlightAsDropTarget();
        } ) ;
        droppables.clear();
    };


    // Given the list of droppables that could potentially be
    // dropped on given where the cursor is, figure out which is on top
    // and tell it to highlight itself. Unhighlight all the others
   this.updateHighlighting = function() {
        // Find the div with the max id
        var max_zindex = -10000,
            max_topmost_zindex = -10000,
            max_id = "";

        //debug.info( "Starting calc of front div" ) ;
        droppables.each( function( id, zindex ) {
            var div_object = jQuery('#'+id),
                tmp_elm = div_object,
                calculated_zindex,
                count = 0,
                max_count = 0;

            //debug.info( "Is div", div.id, "in front?" ) ;
            while (tmp_elm.css("z-index") === "auto") {
                tmp_elm = tmp_elm.parent();
            }
            calculated_zindex = tmp_elm.css("z-index" ) ;

            // Find the zindex for the topmost element
            tmp_elm = div_object;
            var topmost_zindex = null;
            while (true) {
                if (tmp_elm.css("z-index") !== "auto") {
                    topmost_zindex = tmp_elm.css("z-index");
                }
                if (! tmp_elm.parent() || tmp_elm.parent().is("body")) {
                    break;
                }
                tmp_elm = tmp_elm.parent();
                count += 1;
            }
            topmost_zindex = tmp_elm.css("z-index");

            //debug.info( "topmost zindex for", div.id,"is", topmost_zindex, "with count", count ) ;

            if (topmost_zindex > max_topmost_zindex) {
                max_id = id;
                max_zindex = calculated_zindex;
                max_topmost_zindex = topmost_zindex;
                max_count = count;
            }
            else if (topmost_zindex === max_topmost_zindex) {
                /* Use the count to break the tie */
                if (count > max_count) {
                    max_zindex = calculated_zindex;
                    max_id = id;
                    max_count = count;
                }
                else if (count === max_count) {
                    /* If still tied, use the zindex to break the tie */
                    if (calculated_zindex > max_zindex) {
                        max_id = id;
                        max_zindex = calculated_zindex;
                    }
                }
           }
        });

       //debug.info( "updated highlighting: max_zindex, max_topmost_zindex, max_id",
                   //max_zindex, max_topmost_zindex, max_id ) ;

        // Now only highlight the top one
        droppables.each( function(id, zindex) {
            var div_object = jQuery('#'+id),
                o = div_object.data('corresponding_openmdao_object');
            if (id === max_id) {
                /* We only allow dropping onto Assemblies and a good way to check that
                  is the maxmin variable. We also allow dropping onto the top, which is the  */
                if ((id === "dataflow_pane" ) ||
                    (div_object.attr("class").substring(0,14) === "DataflowFigure") ||
                    (div_object.attr("class").indexOf("SlotFigure") !== -1)) {
                    o.highlightAsDropTarget();
                    openmdao.drag_and_drop_manager.drop_target = div_object ;
                }
                else {
                    openmdao.drag_and_drop_manager.drop_target = null ;
                }
            }
            else {
                o.unhighlightAsDropTarget();
            }
        });
    };

    // Find the zindex for the jQuery object by finding the first parent that
    // has a non-auto zindex
    this.computeCalculatedZindex = function(elm) {
        var tmp_elm = elm;
        while (tmp_elm.css("z-index") === "auto") {
            tmp_elm = tmp_elm.parent();
        }
        calculated_zindex = tmp_elm.css("z-index");
        return calculated_zindex ;
    };

    // Find the zindex for the topmost element, the input is a jQuery object
    this.computeTopmostZindex = function(elm) {
        var tmp_elm = elm,
            topmost_zindex = null;
        while (tmp_elm.parent() && ! tmp_elm.is("body")) {
            tmp_elm = tmp_elm.parent() ;
            if (tmp_elm.css( "z-index" ) !== "auto") {
                topmost_zindex = tmp_elm.css("z-index");
            }
        }
        topmost_zindex = tmp_elm.css("z-index");
        return topmost_zindex;
    };

    /**********************************************************************
       For handling drag and drop on workflows
    **********************************************************************/
    var workflow_droppables= new Hashtable(),
        drop_workflow_target = null;

    // get workflow figure top div that contains the draggable, is visible and accepts the
    // type of the draggable
    this.getTopWorkflowDroppableForDropEvent = function(ev, ui) {
        return openmdao.drag_and_drop_manager.drop_workflow_target ;
    };

    // the input should be a jQuery object
    this.draggableWorkflowOut = function(droppable, being_dropped_pathname) {
        workflow_droppables.remove(droppable[0].id);
        openmdao.drag_and_drop_manager.updateWorkflowHighlighting(being_dropped_pathname) ;
    };

    // gets called when the cursor goes inside the passed in parameter element, droppable
    // the input should be a jQuery object
    this.draggableWorkflowOver = function(droppable, being_dropped_pathname) {
        var elm_calculated_zindex = this.computeCalculatedZindex( droppable ) ;
        workflow_droppables.put(droppable[0].id, elm_calculated_zindex );
        openmdao.drag_and_drop_manager.updateWorkflowHighlighting(being_dropped_pathname) ;
    };

    // Given the list of droppables that could potentially be
    // dropped on given where the cursor is, figure out which is on top
    // and tell it to highlight itself. Unhighlight all the others
    this.updateWorkflowHighlighting = function(being_dropped_pathname) {

        // Find the div with the max id
        var max_zindex = -10000,
            max_topmost_zindex = -10000,
            max_id = "" ;

        workflow_droppables.each(function(id, zindex) {
            var div_object = jQuery('#'+id),
                tmp_elm = div_object,
                calculated_zindex,
                count = 0,
                max_count = 0,
                topmost_zindex;

            while (tmp_elm.css("z-index") === "auto") {
                tmp_elm = tmp_elm.parent();
            }
            calculated_zindex = tmp_elm.css("z-index");

            // Find the zindex for the topmost element
            tmp_elm = div_object;
            while(true) {
                if (tmp_elm.css("z-index") !== "auto") {
                    topmost_zindex = tmp_elm.css("z-index");
                }
                if (! tmp_elm.parent() || tmp_elm.parent().is("body")) {
                    break;
                }
                tmp_elm = tmp_elm.parent();
                count += 1;
            }
            topmost_zindex = tmp_elm.css("z-index");

            if (topmost_zindex > max_topmost_zindex) {
                max_id = id;
                max_zindex = calculated_zindex;
                max_topmost_zindex = topmost_zindex;
                max_count = count;
            }
            else if ( topmost_zindex === max_topmost_zindex ) {
                /* Use the count to break the tie */
                if (count > max_count) {
                    max_zindex = calculated_zindex;
                    max_id = id;
                    max_count = count;
                }
                else if (count === max_count) {
                    /* If still tied, use the zindex to break the tie */
                    if (calculated_zindex > max_zindex) {
                       max_id = id;
                       max_zindex = calculated_zindex;
                    }
                }
            }
        });

        // Now only highlight the top one
        workflow_droppables.each( function( id, zindex ) {
            var div_object = jQuery('#'+id),
                o = div_object.data('corresponding_openmdao_object'),
                being_dropped_parent_pathname = openmdao.Util.getPath(being_dropped_pathname),
                dropped_on_pathname = div_object.data('pathname'),
                dropped_on_parent_pathname = openmdao.Util.getPath(dropped_on_pathname);

            if (id === max_id) {
                if (being_dropped_parent_pathname === dropped_on_parent_pathname) {
                    o.highlightAsDropTarget();
                    openmdao.drag_and_drop_manager.drop_workflow_target = div_object;
                }
                else {
                    openmdao.drag_and_drop_manager.drop_workflow_target = null ;
                }
            }
            else {
                o.unhighlightAsDropTarget();
            }
        });
    };

    // clear all droppables
    this.clearHighlightingWorkflowDroppables = function() {
        debug.info("clearHighlightingWorkflowDroppables");
        workflow_droppables.each(function(id, zindex) {
            var div_object = jQuery('#'+id),
                o = div_object.data('corresponding_openmdao_object');
            o.unhighlightAsDropTarget();
        });
        workflow_droppables.clear();
    };
};

