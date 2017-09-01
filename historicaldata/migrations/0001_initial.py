# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-08-29 19:53
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.contrib.postgres.operations import CreateExtension
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        CreateExtension('postgis'),
        migrations.CreateModel(
            name='Border',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('area', models.BigIntegerField(null=True)),
                ('perimeter', models.BigIntegerField(null=True)),
                ('centroid', django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ('geom', django.contrib.gis.db.models.fields.GeometryField(srid=4326)),
                ('label_rank', models.IntegerField()),
                ('label_poz', django.contrib.gis.db.models.fields.MultiPointField(srid=4326)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CapitalCity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Demographics',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('value', models.BigIntegerField()),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Entity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.TextField()),
                ('comment', models.TextField()),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='EntityLanguage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('percent', models.FloatField(null=True)),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='EntityScript',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='EntityType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField(unique=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='EntityWikipedia',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url', models.URLField()),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='EthnicDemographic',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('percentage', models.DecimalField(decimal_places=4, max_digits=7)),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('ethnic_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.TextField()),
                ('date_start', models.TextField()),
                ('date_end', models.TextField(null=True)),
                ('comment', models.TextField(null=True)),
                ('entity', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='EventType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('desc', models.TextField(unique=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='EventWikipedia',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url', models.URLField()),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='GDP',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('value', models.BigIntegerField()),
                ('currency', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Government',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='GovernmentType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('desc', models.TextField(unique=True)),
                ('parent_type', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.GovernmentType')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='MetaSource',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='MetaSourceType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('desc', models.TextField(unique=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Name',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('value', models.TextField()),
                ('lang_code_iso', models.CharField(max_length=5)),
                ('is_official', models.BooleanField(default=False)),
                ('is_own_language', models.BooleanField(default=False)),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='OfficialCurrency',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('symbol', models.CharField(max_length=2, null=True)),
                ('currency', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ReligionDemographic',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(null=True)),
                ('percentage', models.DecimalField(decimal_places=4, max_digits=7)),
                ('entity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event')),
                ('religion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Source',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('desc', models.TextField()),
                ('url', models.URLField(null=True)),
                ('meta_source', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.MetaSource')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='SourceType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('desc', models.TextField(unique=True)),
            ],
        ),
        migrations.AddField(
            model_name='source',
            name='type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.SourceType'),
        ),
        migrations.AddField(
            model_name='metasource',
            name='type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.MetaSourceType'),
        ),
        migrations.AddField(
            model_name='government',
            name='type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.GovernmentType'),
        ),
        migrations.AddField(
            model_name='gdp',
            name='source',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Source'),
        ),
        migrations.AddField(
            model_name='event',
            name='type',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.EventType'),
        ),
        migrations.AddField(
            model_name='ethnicdemographic',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event'),
        ),
        migrations.AddField(
            model_name='ethnicdemographic',
            name='source',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Source'),
        ),
        migrations.AddField(
            model_name='entityscript',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event'),
        ),
        migrations.AddField(
            model_name='entityscript',
            name='script',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity'),
        ),
        migrations.AddField(
            model_name='entitylanguage',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event'),
        ),
        migrations.AddField(
            model_name='entitylanguage',
            name='language',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity'),
        ),
        migrations.AddField(
            model_name='entity',
            name='type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.EntityType'),
        ),
        migrations.AddField(
            model_name='demographics',
            name='entity',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity'),
        ),
        migrations.AddField(
            model_name='demographics',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event'),
        ),
        migrations.AddField(
            model_name='demographics',
            name='source',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Source'),
        ),
        migrations.AddField(
            model_name='capitalcity',
            name='capital_city',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity'),
        ),
        migrations.AddField(
            model_name='capitalcity',
            name='entity',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity'),
        ),
        migrations.AddField(
            model_name='capitalcity',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event'),
        ),
        migrations.AddField(
            model_name='border',
            name='entity',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Entity'),
        ),
        migrations.AddField(
            model_name='border',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Event'),
        ),
        migrations.AddField(
            model_name='border',
            name='source',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='historicaldata.Source'),
        ),
        migrations.AlterUniqueTogether(
            name='religiondemographic',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='officialcurrency',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='name',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='government',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='gdp',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='ethnicdemographic',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='entityscript',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='entitylanguage',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='demographics',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='capitalcity',
            unique_together=set([('entity', 'event')]),
        ),
        migrations.AlterUniqueTogether(
            name='border',
            unique_together=set([('entity', 'event')]),
        ),
    ]
