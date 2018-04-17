<div class="calender-body">
    <table cellpadding="0" cellspacing="0">
        {{if mode == "days"}}
        <thead>
            <tr>
                {{each days as item}}
                <th class="dow">{{item}}</th>
                {{/each}}
            </tr>
        </thead>
        {{/if}}
        {{if mode == "times"}}
        <thead>
            <tr>
                {{if level >= 4}}
                	<th class="dow">时</th>
                {{/if}}
                {{if level >= 5}}
                	<th class="dow">分</th>
                {{/if}}
                {{if level >= 6}}
                	<th class="dow">秒</th>
                {{/if}}
            </tr>
        </thead>
        {{/if}}
        <tbody>
        </tbody>
    </table>
</div>