#JQuery 源码分析


##Sizzle
 先从sizzle开始，sizzle 是jq的 的选择器引擎，非常强大，也非常复杂，阅读起来难度非常大。
 
###sizzle里的正则
* whitespace

	[\\x20\\t\\r\\n\\f]
		
		\\x20 空格  \t制表符 \r回车符号 \n 换行符 \f换页符
 
* characterEncoding

	(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+  
 
 		第一部分 \\\\. 匹配有\开头和除了换行符外的其它字符  
 		第二部分 \\w- 匹配字符 数字 和 连字符
 		第三部分 \x00-\xa0 匹配非ascii码
 
* identifier

	characterEncoding.replace( "w", "w#" ),
	
		这个简单，将#补充进去，可能用于侦测 href
	
* attributes

	"\\[" + whitespace + "\*(" + characterEncoding + ")(?:" + whitespace +"\*([\*^$|!~]?=)" + whitespace +"\*(?:'((?:\\\\.|[^\\\\'])\*)'|\"((?:\\\\.|[^\\\\\"])\*)\"|(" + identifier + "))|)" + whitespace +"*\\]";
		
	 	模拟一下 [  attr(属性名) =、*=、^=、$=、|=、!=、~=(匹配符号)  '" val(值) "']  
	
* pseudos

":(" + characterEncoding + ")(?:\\((" +
				"('((?:\\\\.|[^\\\\'])\*)'|\"((?:\\\\.|[^\\\\\"])\*)\")|" +
				"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")\*)|" +
		".\*" +
		")\\)|)",	
	
	伪类选择器 :last-child   :not(checked)  :not([attr=val])
	:not([attr = 'val'])	
	子表达式中最后的竖线相当于?的作用，表示前面的表达式可以没有或有1个匹配项
	
### Sizzle的结构




### Sizzle 内幕

 Sizzle 构造器
 	
 	/**
 	  Sizzle  jq 选择器
 	  @param selector 选择器字符串
 	  @param context 执行匹配的最初上下文
 	  @param results 已匹配出的部分最终结果
 	  @param seed 种子集 带遴选的结果集 
 	**/
 	
 		function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA 变量
		i, groups, old, nid, newContext, newSelector;
	
	//发现 context 和 当前 docuemnt 不相等 立马刷新
	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	// 约定context 必须是 document 和 element	
	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

    //不存在种子集 且文档类型是 HTML 的时候
	if ( documentIsHTML && !seed ) {

		// 加速器
		// rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/
		
		if ( (match = rquickExpr.exec( selector )) ) {
			// ID:  Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context 是 Element
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// TAG: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// ClASS: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// 存在queryselectorAll 情况 rbuggySQA 是 qsa 存在bug的 情况
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			
			//qsa 查询的 根元素为元素是 会有 bug 类似 qsa('div div p') => bug
			//作者强行 给根元素 一个id 
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
			   // 分块
				groups = tokenize( selector );
				
				//给 引号 转义符 转义
				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				//如果发现是兄弟节点 上下文转成 父节点
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// 没有加速的
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
    }
    
Sizzle 的构造器 中规中矩 没有什么奇技淫巧, 但是 Sizzle 里的函数 还是有给人耳目一新的感觉，举例:

*Support的 与 assert 思路
我们来验证 某一个function or 一个属性 的兼容型
常用的方法把 差异渗透进 逻辑里 很普遍 把差异性单独 取出来放在support 里很好多 细化差异*

		support = Sizzle.support = {};
		
		function assert( fn ) {
			var div = document.createElement("div");
		
			try {
				return !!fn( div );
			} catch (e) {
				return false;
			} finally {
				// Remove from its parent by default
				if ( div.parentNode ) {
					div.parentNode.removeChild( div );
				}
				// release memory in IE
				div = null;
			}
		}

			// 检查getELementsByTagName（“*”）返回的是否只有元素节点类型（可能有注释节点）
            support.getElementsByTagName = assert(function( div ) {
                //创建并添加注释节点
                div.appendChild( doc.createComment("") );
                //使用getElementsByTagName("*")如果得到结果length不为0，返回false
                return !div.getElementsByTagName("*").length;
            });
