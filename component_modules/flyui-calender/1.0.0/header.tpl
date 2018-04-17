<div class="calender-head clearfix">
    {{if menu}}
    <span class="next" unselectable="on"><i class="icon icon-right"></i></span>
    <span class="prev" unselectable="on"><i class="icon icon-left"></i></span>
    {{/if}}
    <div class="date">
        {{if name}}请选择{{name}}{{else}}
        <span class="year">{{year}}年</span>
        <span class="month">{{month}}</span>
            {{if time}}
            <span class="time">{{time}}</span>
            {{/if}}
        {{/if}}
    </div>
</div>