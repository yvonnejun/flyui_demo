<div class="alert{{if close}} alert-dismissable{{/if}} {{if type}}alert-{{type}}{{/if}} {{if className}}{{className}}{{/if}} {{if icon}}alert-icon{{/if}}">
    {{if closable}}
    	<button type="button" class="close" title="{{closeTitle}}">
    		{{if closeText}}
				<span class="close-text">{{closeText}}</span>
    		{{else}}
				<i class="icon icon-cross"></i>
    		{{/if}}
    	</button>
    {{/if}}
    {{if icon}}
    	<i class="icon {{icon}}"></i>
    {{/if}}
    <span class="alert-content">{{# content}}</span>
</div>