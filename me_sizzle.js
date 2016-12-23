(function(){
    var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
        expando = "sizcache" + (Math.random() + '').replace('.', ''),
        done = 0,
        toString = Object.prototype.toString,
        rBackslash = /\\/g,
        rNonWord = /\W/g;

    var Sizzle = function(selector, context, results, seed){
        results = results || [];
        context = context || document;

        var origContext = context;

        if(context.nodeType !== 1 && context.nodeType !== 9){
            return  [];
        }

        if(!selector || typeof selector !== "string"){
            return results;
        }

        var m, set, checkSet, extra, ret, cur, pop, i,
            parts = [],
            soFar = selector;

        do{
            chunker.exec("");
            m = chunker.exec(soFar);

            if(m){
                soFar = m[3];

                parts.push(m[1]);

                if(m[2]){
                    extra = m[3];
                    break;
                }
            }
        }while(m);

        console.log(parts);


        if(context){
            ret = seed ? {expr: parts.pop(), set: makeArray(seed)}
                       : Sizzle.find(parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode  ? context.parentNode : context);

            console.log("从右向左第一层",ret);

            set = ret.expr ? Sizzle.filter(ret.expr, ret.set)
                   : ret.set;

            console.log("从右向左第一层过滤后的样本集", set);

            checkSet = makeArray(set);

            while(parts.length){
                cur = parts.pop();
                pop = cur;

                //获取一个选择项 一个操作符
               if (!Expr.relative[ cur ]) {
                    cur = "";
                }else{
                    pop = parts.pop();
                }

                if(pop == null){
                    pop = context;
                }
                console.log('************');
                console.log('上层遍历信息');
                console.log(cur);
                console.log(pop);
                console.log(checkSet);
                console.log('*************');
                Expr.relative[cur](checkSet, pop);
            }
        }else{
            checkSet = parts = [];
        }

        if(!checkSet){
            checkSet = set;
        }

        if ( !checkSet ) {
            Sizzle.error( cur || selector );
        }

        if ( toString.call(checkSet) === "[object Array]" ) {
            if (context && context.nodeType === 1) {
                for (i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i]))) {
                        results.push(set[i]);
                    }
                }
            }
            else {
                for (i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && checkSet[i].nodeType === 1) {
                        results.push(set[i]);
                    }
                }
            }

        }else{
            makeArray(checkSet, results);
        }

        if(extra){
            Sizzle(extra, origContext, results, seed);
            Sizzle.uniqueSort(results);
        }

        return results;
    }

    Sizzle.find = function(expr, context){
        var set, i, len, match, type, left;

        if(!expr){
            return [];
        }

        for(i=0, len=Expr.order.length; i<len; i++){
            type = Expr.order[i];

            if((match = Expr.leftMatch[type].exec(expr))){
                match.splice(1,1);

                set = Expr.find[type](match, context);

                if(set != null){
                    expr = expr.replace(Expr.match[type], "");
                    break;
                }
            }
        }

        if(!set){
            set = typeof context.getElementsByTagName !== "undefined" ?
                context.getElementsByTagName( "*" ) :
                [];
        }
        return { set: set, expr: expr };
    }

    Sizzle.filter = function(expr, set, inplace, not){
        var match, anyFound,
            type, found, item, filter, left,
            i, pass,
            old = expr,
            results = [],
            curLoop = set;


        console.log('filter');
        while(expr && set.length){
            console.log("每次过滤的字符集和样本集",expr, set);

            for(type in Expr.filter){
                if((match = Expr.leftMatch[type].exec(expr)) != null && match[2]){
                    filter = Expr.filter[type];

                    anyFound = false;
                    match.splice(1,1);
                    if(curLoop === results){
                        results = [];
                    }


                    if(Expr.preFilter[type]){
                        match = Expr.preFilter[type](match, curLoop, inplace, results, not);

                        if(!match){
                            anyFound = found = true;
                        }else if(match === true){
                            continue;
                        }
                    }


                    if(match){
                        for(i=0; (item = curLoop[i]) != null; i++){
                            if(item){

                                found = filter(item, match, i, curLoop);
                                pass = not ^ found;



                                if(inplace && found!= null){
                                    if(pass){
                                        anyFound = true;
                                    }else{
                                        curLoop[i] = false;
                                    }
                                }else if(pass){
                                    results.push(item);
                                    anyFound = true;
                                }
                            }
                        }
                    }


                    if(found !== undefined){
                        if(!inplace){
                            curLoop = results;
                        }

                        expr = expr.replace( Expr.match[ type ], "" );

                        if(!anyFound){
                            return [];
                        }

                        break;
                    }
                }
            }

            // Improper expression
            if ( expr === old ) {
                if ( anyFound == null ) {
                    Sizzle.error( expr );

                } else {
                    break;
                }
            }

            old = expr;
        }

        console.log("最终filter", curLoop);
        return curLoop;
    }
    var Expr = Sizzle.selectors = {
        order: [ "ID", "NAME", "TAG" ],

        match: {
            ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
            CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
            NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
            ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
            TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
            CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
            POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
            PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
        },

        leftMatch: {},

        attrMap: {
            "class": "className",
            "for": "htmlFor"
        },

        attrHandle: {
            href: function( elem ) {
                return elem.getAttribute( "href" );
            },
            type: function( elem ) {
                return elem.getAttribute( "type" );
            }
        },

        relative: {
            "+": function(checkSet, part){
                var isPartStr = typeof part === "string",
                    isTag = isPartStr && !rNonWord.test( part ),
                    isPartStrNotTag = isPartStr && !isTag;

                if ( isTag ) {
                    part = part.toLowerCase();
                }

                for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
                    if ( (elem = checkSet[i]) ) {
                        while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

                        checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
                        elem || false :
                        elem === part;
                    }
                }

                if ( isPartStrNotTag ) {
                    Sizzle.filter( part, checkSet, true );
                }
            },

            ">": function( checkSet, part ) {
                var elem,
                    isPartStr = typeof part === "string",
                    i = 0,
                    l = checkSet.length;

                if ( isPartStr && !rNonWord.test( part ) ) {
                    part = part.toLowerCase();

                    for ( ; i < l; i++ ) {
                        elem = checkSet[i];

                        if ( elem ) {
                            var parent = elem.parentNode;
                            checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
                        }
                    }

                } else {
                    for ( ; i < l; i++ ) {
                        elem = checkSet[i];

                        if ( elem ) {
                            checkSet[i] = isPartStr ?
                                elem.parentNode :
                            elem.parentNode === part;
                        }
                    }

                    if ( isPartStr ) {
                        Sizzle.filter( part, checkSet, true );
                    }
                }
            },

            "": function(checkSet, part, isXML){
                var nodeCheck,
                    doneName = done++,
                    checkFn = dirCheck;


                if ( typeof part === "string" && !rNonWord.test( part ) ) {
                    part = part.toLowerCase();
                    nodeCheck = part;
                    checkFn = dirNodeCheck;
                }

                checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
            },

            "~": function( checkSet, part, isXML ) {
                var nodeCheck,
                    doneName = done++,
                    checkFn = dirCheck;

                if ( typeof part === "string" && !rNonWord.test( part ) ) {
                    part = part.toLowerCase();
                    nodeCheck = part;
                    checkFn = dirNodeCheck;
                }

                checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
            }
        },

        find: {
            ID: function( match, context) {

                if ( typeof context.getElementById !== "undefined") {
                    var m = context.getElementById(match[1]);

                    // Check parentNode to catch when Blackberry 4.6 returns
                    // nodes that are no longer in the document #6963
                    return m ? [m] : [];
                }
            },

            NAME: function( match, context ) {
                if ( typeof context.getElementsByName !== "undefined" ) {
                    var ret = [],
                        results = context.getElementsByName( match[1] );

                    for ( var i = 0, l = results.length; i < l; i++ ) {
                        if ( results[i].getAttribute("name") === match[1] ) {
                            ret.push( results[i] );
                        }
                    }

                    return ret.length === 0 ? null : ret;
                }
            },

            TAG: function( match, context ) {
                if ( typeof context.getElementsByTagName !== "undefined" ) {
                    return context.getElementsByTagName( match[1] );
                }
            }
        },
        preFilter: {
            CLASS: function( match, curLoop, inplace, result, not, isXML ) {
                match = " " + match[1].replace( rBackslash, "" ) + " ";

                if ( isXML ) {
                    return match;
                }

                for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
                    if ( elem ) {
                        if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
                            if ( !inplace ) {
                                result.push( elem );
                            }

                        } else if ( inplace ) {
                            curLoop[i] = false;
                        }
                    }
                }

                return false;
            },

            ID: function( match ) {
                return match[1].replace( rBackslash, "" );
            },

            TAG: function( match, curLoop ) {
                return match[1].replace( rBackslash, "" ).toLowerCase();
            },

            CHILD: function( match ) {
                if ( match[1] === "nth" ) {
                    if ( !match[2] ) {
                        Sizzle.error( match[0] );
                    }

                    match[2] = match[2].replace(/^\+|\s*/g, '');

                    // parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
                    var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
                        match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
                        !/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

                    // calculate the numbers (first)n+(last) including if they are negative
                    match[2] = (test[1] + (test[2] || 1)) - 0;
                    match[3] = test[3] - 0;
                }
                else if ( match[2] ) {
                    Sizzle.error( match[0] );
                }

                // TODO: Move to normal caching system
                match[0] = done++;

                return match;
            },

            ATTR: function( match, curLoop, inplace, result, not, isXML ) {
                var name = match[1] = match[1].replace( rBackslash, "" );

                if ( !isXML && Expr.attrMap[name] ) {
                    match[1] = Expr.attrMap[name];
                }

                // Handle if an un-quoted value was used
                match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

                if ( match[2] === "~=" ) {
                    match[4] = " " + match[4] + " ";
                }

                return match;
            },

            PSEUDO: function( match, curLoop, inplace, result, not ) {
                if ( match[1] === "not" ) {
                    // If we're dealing with a complex expression, or a simple one
                    if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
                        match[3] = Sizzle(match[3], null, null, curLoop);

                    } else {
                        var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

                        if ( !inplace ) {
                            result.push.apply( result, ret );
                        }

                        return false;
                    }

                } else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
                    return true;
                }

                return match;
            },

            POS: function( match ) {
                match.unshift( true );

                return match;
            }
        },

        filters: {
            enabled: function( elem ) {
                return elem.disabled === false && elem.type !== "hidden";
            },

            disabled: function( elem ) {
                return elem.disabled === true;
            },

            checked: function( elem ) {
                return elem.checked === true;
            },

            selected: function( elem ) {
                // Accessing this property makes selected-by-default
                // options in Safari work properly
                if ( elem.parentNode ) {
                    elem.parentNode.selectedIndex;
                }

                return elem.selected === true;
            },

            parent: function( elem ) {
                return !!elem.firstChild;
            },

            empty: function( elem ) {
                return !elem.firstChild;
            },

            has: function( elem, i, match ) {
                return !!Sizzle( match[3], elem ).length;
            },

            header: function( elem ) {
                return (/h\d/i).test( elem.nodeName );
            },

            text: function( elem ) {
                var attr = elem.getAttribute( "type" ), type = elem.type;
                // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
                // use getAttribute instead to test this case
                return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
            },

            radio: function( elem ) {
                return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
            },

            checkbox: function( elem ) {
                return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
            },

            file: function( elem ) {
                return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
            },

            password: function( elem ) {
                return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
            },

            submit: function( elem ) {
                var name = elem.nodeName.toLowerCase();
                return (name === "input" || name === "button") && "submit" === elem.type;
            },

            image: function( elem ) {
                return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
            },

            reset: function( elem ) {
                var name = elem.nodeName.toLowerCase();
                return (name === "input" || name === "button") && "reset" === elem.type;
            },

            button: function( elem ) {
                var name = elem.nodeName.toLowerCase();
                return name === "input" && "button" === elem.type || name === "button";
            },

            input: function( elem ) {
                return (/input|select|textarea|button/i).test( elem.nodeName );
            },

            focus: function( elem ) {
                return elem === elem.ownerDocument.activeElement;
            }
        },
        setFilters: {
            first: function( elem, i ) {
                return i === 0;
            },

            last: function( elem, i, match, array ) {
                return i === array.length - 1;
            },

            even: function( elem, i ) {
                return i % 2 === 0;
            },

            odd: function( elem, i ) {
                return i % 2 === 1;
            },

            lt: function( elem, i, match ) {
                return i < match[3] - 0;
            },

            gt: function( elem, i, match ) {
                return i > match[3] - 0;
            },

            nth: function( elem, i, match ) {
                return match[3] - 0 === i;
            },

            eq: function( elem, i, match ) {
                return match[3] - 0 === i;
            }
        },
        filter: {
            PSEUDO: function( elem, match, i, array ) {
                var name = match[1],
                    filter = Expr.filters[ name ];

                if ( filter ) {
                    return filter( elem, i, match, array );

                } else if ( name === "contains" ) {
                    return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;

                } else if ( name === "not" ) {
                    var not = match[3];

                    for ( var j = 0, l = not.length; j < l; j++ ) {
                        if ( not[j] === elem ) {
                            return false;
                        }
                    }

                    return true;

                } else {
                    Sizzle.error( name );
                }
            },

            CHILD: function( elem, match ) {
                var first, last,
                    doneName, parent, cache,
                    count, diff,
                    type = match[1],
                    node = elem;

                switch ( type ) {
                    case "only":
                    case "first":
                        while ( (node = node.previousSibling) )	 {
                            if ( node.nodeType === 1 ) {
                                return false;
                            }
                        }

                        if ( type === "first" ) {
                            return true;
                        }

                        node = elem;

                    case "last":
                        while ( (node = node.nextSibling) )	 {
                            if ( node.nodeType === 1 ) {
                                return false;
                            }
                        }

                        return true;

                    case "nth":
                        first = match[2];
                        last = match[3];

                        if ( first === 1 && last === 0 ) {
                            return true;
                        }

                        doneName = match[0];
                        parent = elem.parentNode;

                        if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
                            count = 0;

                            for ( node = parent.firstChild; node; node = node.nextSibling ) {
                                if ( node.nodeType === 1 ) {
                                    node.nodeIndex = ++count;
                                }
                            }

                            parent[ expando ] = doneName;
                        }

                        diff = elem.nodeIndex - last;

                        if ( first === 0 ) {
                            return diff === 0;

                        } else {
                            return ( diff % first === 0 && diff / first >= 0 );
                        }
                }
            },

            ID: function( elem, match ) {
                return elem.nodeType === 1 && elem.getAttribute("id") === match;
            },

            TAG: function( elem, match ) {
                return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
            },

            CLASS: function( elem, match ) {
                return (" " + (elem.className || elem.getAttribute("class")) + " ")
                        .indexOf( match ) > -1;
            },

            ATTR: function( elem, match ) {
                var name = match[1],
                    result = Sizzle.attr ?
                        Sizzle.attr( elem, name ) :
                        Expr.attrHandle[ name ] ?
                            Expr.attrHandle[ name ]( elem ) :
                            elem[ name ] != null ?
                                elem[ name ] :
                                elem.getAttribute( name ),
                    value = result + "",
                    type = match[2],
                    check = match[4];

                return result == null ?
                type === "!=" :
                    !type && Sizzle.attr ?
                    result != null :
                        type === "=" ?
                        value === check :
                            type === "*=" ?
                            value.indexOf(check) >= 0 :
                                type === "~=" ?
                                (" " + value + " ").indexOf(check) >= 0 :
                                    !check ?
                                    value && result !== false :
                                        type === "!=" ?
                                        value !== check :
                                            type === "^=" ?
                                            value.indexOf(check) === 0 :
                                                type === "$=" ?
                                                value.substr(value.length - check.length) === check :
                                                    type === "|=" ?
                                                    value === check || value.substr(0, check.length + 1) === check + "-" :
                                                        false;
            },

            POS: function( elem, match, i, array ) {
                var name = match[2],
                    filter = Expr.setFilters[ name ];

                if ( filter ) {
                    return filter( elem, i, match, array );
                }
            }
        }
    };

    var origPOS = Expr.match.POS,
        fescape = function(all, num){
            return "\\" + (num - 0 + 1);
        };

    for ( var type in Expr.match ) {
        Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
        Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
    }

    function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
        for ( var i = 0, l = checkSet.length; i < l; i++ ) {
            var elem = checkSet[i];

            if ( elem ) {
                var match = false;

                elem = elem[dir];

                while ( elem ) {
                    if ( elem[ expando ] === doneName ) {
                        match = checkSet[elem.sizset];
                        break;
                    }

                    if ( elem.nodeType === 1 && !isXML ){
                        elem[ expando ] = doneName;
                        elem.sizset = i;
                    }

                    if ( elem.nodeName.toLowerCase() === cur ) {
                        match = elem;
                        break;
                    }

                    elem = elem[dir];
                }

                checkSet[i] = match;
            }
        }
    }

    function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {

        for ( var i = 0, l = checkSet.length; i < l; i++ ) {
            var elem = checkSet[i];

            if ( elem ) {
                var match = false;

                elem = elem[dir];

                while ( elem ) {
                    if ( elem[ expando ] === doneName ) {
                        match = checkSet[elem.sizset];
                        break;
                    }

                    if ( elem.nodeType === 1 ) {
                        if ( !isXML ) {
                            elem[ expando ] = doneName;
                            elem.sizset = i;
                        }

                        if ( typeof cur !== "string" ) {
                            if ( elem === cur ) {
                                match = true;
                                break;
                            }

                        }
                        else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
                            match = elem;
                            break;
                        }
                    }

                    elem = elem[dir];
                }

                checkSet[i] = match;
            }
        }
    }
    var makeArray = function( array, results ) {
        array = Array.prototype.slice.call( array, 0 );

        if ( results ) {
            results.push.apply( results, array );
            return results;
        }

        return array;
    };

    Sizzle.error = function( msg ) {
        throw new Error( "Syntax error, unrecognized expression: " + msg );
    };

    window.Sizzle = Sizzle;
}())