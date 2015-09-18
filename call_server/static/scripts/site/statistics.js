/*global CallPower, Backbone */

(function () {
  CallPower.Views.StatisticsView = Backbone.View.extend({
    el: $('#statistics'),
    campaignId: null,

    events: {
      'change select[name="campaigns"]': 'changeCampaign',
      'change select[name="timespan"]': 'renderChart',
    },

    initialize: function() {
      this.$el.find('.input-daterange input').each(function (){
        $(this).datepicker({
          'format': "yyyy/mm/dd"
        });
      });

      _.bindAll(this, 'renderChart');
      this.$el.on('changeDate', this.renderChart);

      this.chartOpts = {
        "library":{"canvasDimensions":{"height":250}},
      };

      this.campaignDataTemplate = _.template($('#campaign-data-tmpl').html(), { 'variable': 'data' });
    },

    changeCampaign: function(event) {
      var self = this;

      this.campaignId = $('select[name="campaigns"]').val();
      $.getJSON('/api/campaign/'+this.campaignId+'/stats.json',
        function(data) {
          if (data.completed && data.total_count) {
            var conversion_rate = (data.completed / data.total_count);
            conversion_pct = Number((conversion_rate*100).toFixed(2));
            data.success_rate = (conversion_pct+"%");
          } else {
            data.success_rate = 'n/a';
          }
          $('#campaign_data').html(
            self.campaignDataTemplate(data)
          ).show();

          if (data.date_first && data.date_last) {
            $('input[name="start"]').datepicker('setDate', data.date_first);
            $('input[name="end"]').datepicker('setDate', data.date_last);
          }
          self.renderChart();
        });
    },

    renderChart: function(event) {
      if (!this.campaignId) {
        return false;
      }

      var timespan = $('select[name="timespan"]').val();
      var start = new Date($('input[name="start"]').datepicker('getDate')).toISOString();
      var end = new Date($('input[name="end"]').datepicker('getDate')).toISOString();

      if (start > end) {
        $('.input-daterange input[name="start"]').addClass('error');
        return false;
      } else {
        $('.input-daterange input').removeClass('error');
      }

      var dataUrl = '/api/campaign/'+this.campaignId+'/call_chart.json?timespan='+timespan;
      if (start) {
        dataUrl += ('&start='+start);
      }
      if (end) {
        dataUrl += ('&end='+end);
      }

      this.chart = new Chartkick.LineChart('calls_for_campaign', dataUrl, this.chartOpts);
    }

  });

})();